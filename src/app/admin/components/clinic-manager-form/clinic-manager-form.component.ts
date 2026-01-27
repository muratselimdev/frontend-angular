import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StaffService } from '../../services/staff.service';
import { ClinicService } from '../../services/clinic.service';

@Component({
  selector: 'app-clinic-managers-form',
  templateUrl: './clinic-manager-form.component.html',
  styleUrl: './clinic-manager-form.component.css',
  standalone: false
})
export class ClinicManagerFormComponent implements OnInit {
  form!: FormGroup;
  id?: number;
  clinics: any[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private svc: StaffService,
    private clinicSvc: ClinicService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', this.id ? [] : [Validators.required, Validators.minLength(6)]],
      clinicId: [null, Validators.required],
      isActive: [true]
    });

    this.clinicSvc.list().subscribe(res => this.clinics = res);
    if (this.id) this.load();
  }

  load() {
    this.loading = true;
    this.svc.get(this.id!).subscribe({
      next: res => { this.form.patchValue(res); this.loading = false; },
      error: _ => this.loading = false
    });
  }

  save() {
    if (this.form.invalid) return;
    const data = { ...this.form.value, role: 'ClinicManager' };
    if (this.id) {
      this.svc.update(this.id, data).subscribe(() => this.router.navigate(['/admin/clinic-managers']));
    } else {
      this.svc.create(data).subscribe(() => this.router.navigate(['/admin/clinic-managers']));
    }
  }

  cancel() {
    this.router.navigate(['/admin/clinic-managers']);
  }
}
