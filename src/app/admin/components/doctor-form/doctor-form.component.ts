import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BranchService } from '../../services/branch.service';
import { ClinicService } from '../../services/clinic.service';
import { HospitalService } from '../../services/hospital.service';

@Component({
  selector: 'app-doctor-form',
  templateUrl: './doctor-form.component.html',
  styleUrl: './doctor-form.component.css',
  standalone: false
})
export class DoctorFormComponent implements OnInit {
  form!: FormGroup;
  id?: number;
  loading = false;

  clinics: any[] = [];
  hospitals: any[] = [];

  constructor(
    private fb: FormBuilder,
    private svc: StaffService,
    private clinicSvc: ClinicService,
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
      clinicId: [null],
      hospitalId: [null],
      isActive: [true]
    });

    this.loadDropdowns();

    if (this.id) {
      this.load();
    }
  }

  loadDropdowns() {
    this.clinicSvc.list().subscribe(res => (this.clinics = res));
    this.hospitalSvc.list().subscribe(res => (this.hospitals = res));
  }

  load() {
    this.loading = true;
    this.svc.get(this.id!).subscribe({
      next: res => {
        this.form.patchValue(res);
        this.loading = false;
      },
      error: _ => (this.loading = false)
    });
  }

  save() {
    if (this.form.invalid) return;
    const data = { ...this.form.value, role: 'Doctor' };

    if (this.id) {
      this.svc.update(this.id, data).subscribe(() => this.router.navigate(['/admin/doctors']));
    } else {
      this.svc.create(data).subscribe(() => this.router.navigate(['/admin/doctors']));
    }
  }

  cancel() {
    this.router.navigate(['/admin/doctors']);
  }
}
