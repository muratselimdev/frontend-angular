import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { BranchService } from '../../services/branch.service';
import { LanguageGroupService } from '../../services/language-group.service';

@Component({
  selector: 'app-translator-form',
  templateUrl: './translator-form.component.html',
  styleUrl: './translator-form.component.scss',
  standalone: false
})
export class TranslatorFormComponent implements OnInit {
  form!: FormGroup;
  id?: number;
  loading = false;
  branches: any[] = [];
  langs: any[] = [];
  leads: any[] = []; 

  constructor(
    private fb: FormBuilder,
    private staff: StaffService,
    private branchesSvc: BranchService,
    private langsSvc: LanguageGroupService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

ngOnInit(): void {
  this.id = Number(this.route.snapshot.paramMap.get('id'));
  this.form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', this.id ? [] : [Validators.required, Validators.minLength(6)]],
    branchId: [null, Validators.required],
    languageGroupId: [null, Validators.required],
    translatorLeadId: [null, Validators.required],   
    isActive: [true]
  });

    this.loadDropdowns();
    if (this.id) this.load();
  }

  loadDropdowns() {
    this.branchesSvc.list().subscribe(b => this.branches = b);
    this.langsSvc.list().subscribe(l => this.langs = l);
    this.staff.listByRole('TranslatorLead').subscribe(leads => this.leads = leads);
  }

  load() {
    this.loading = true;
    this.staff.get(this.id!).subscribe({
      next: res => { this.form.patchValue(res); this.loading = false; },
      error: _ => { this.loading = false; }
    });
  }

  save() {
    if (this.form.invalid) return;
    const data = { ...this.form.value, role: 'Translator' };

    if (this.id) {
      this.staff.update(this.id, data).subscribe(() => this.router.navigate(['/admin/translators']));
    } else {
      this.staff.create(data).subscribe(() => this.router.navigate(['/admin/translators']));
    }
  }

  cancel() {
    this.router.navigate(['/admin/translators']);
  }
}
