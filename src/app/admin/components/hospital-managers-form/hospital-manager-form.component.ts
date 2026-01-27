import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StaffService } from '../../services/staff.service';
import { HospitalService } from '../../services/hospital.service';

@Component({
  selector: 'app-hospital-manager-form',
  templateUrl: './hospital-manager-form.component.html',
  styleUrl: './hospital-manager-form.component.css',
  standalone: false
})
export class HospitalManagerFormComponent implements OnInit {
  form!: FormGroup;
  id?: number;
  hospitals: any[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private svc: StaffService,
    private hospitalSvc: HospitalService,
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
      hospitalId: [null, Validators.required],
      isActive: [true]
    });

    this.hospitalSvc.list().subscribe(res => this.hospitals = res);
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
    const data = { ...this.form.value, role: 'HospitalManager' };
    if (this.id) {
      this.svc.update(this.id, data).subscribe(() => this.router.navigate(['/admin/hospital-managers']));
    } else {
      this.svc.create(data).subscribe(() => this.router.navigate(['/admin/hospital-managers']));
    }
  }

  cancel() {
    this.router.navigate(['/admin/hospital-managers']);
  }
}
