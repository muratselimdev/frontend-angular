import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Branch, LanguageGroup, SupervisorVm } from '../../models/staff.models';
import { LookupsService } from '../../services/lookups.service';
import { SupervisorsService } from '../../services/supervisors.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-supervisor-form',
  templateUrl: './supervisor-form.component.html',
  styleUrl: './supervisor-form.component.css',
  standalone: false
})
export class SupervisorFormComponent implements OnInit {
  id?: number;
  isEdit = false;
  form!: FormGroup;
  branches: Branch[] = [];
  langs: LanguageGroup[] = [];
  loading = false;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private lk: LookupsService,
    private api: SupervisorsService
  ) {}

  ngOnInit() {
    this.lk.branches().subscribe(r => this.branches = r);
    this.lk.languageGroups({ isActive: true }).subscribe(r => this.langs = r);

    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;
    if (id) this.id = +id;

    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: [''],
      branchId: [null, Validators.required],
      languageGroupId: [null, Validators.required],
      nickname: [''],
      isActive: [true]
    });

    if (this.isEdit && this.id) {
      this.api.get(this.id).subscribe((s: SupervisorVm) => {
        this.form.patchValue({
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          phone: s.phone || '',
          branchId: s.branchId,
          languageGroupId: s.languageGroupId,
          nickname: s.nickname || '',
          isActive: s.isActive
        });
      });
    } else {
      this.form.get('password')?.addValidators([Validators.required, Validators.minLength(6)]);
    }
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;
    const v = this.form.value;

    let req$;

    if (this.isEdit && this.id) {
      const dto = {
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phone: v.phone || undefined,
        password: v.password || undefined,
        branchId: v.branchId,
        languageGroupId: v.languageGroupId,
        nickname: v.nickname || undefined,
        isActive: !!v.isActive
      };
      req$ = this.api.update(this.id, dto);
    } else {
      const dto = {
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phone: v.phone || undefined,
        password: v.password,
        branchId: v.branchId,
        languageGroupId: v.languageGroupId,
        nickname: v.nickname || undefined
      };
      req$ = this.api.create(dto);
    }

    req$.subscribe({
      next: () => this.router.navigate(['/admin/supervisors']),
      error: () => (this.loading = false)
    });
  }

  cancel() {
    this.router.navigate(['/admin/supervisors']);
  }

}
