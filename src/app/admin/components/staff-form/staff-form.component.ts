import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { Staff } from '../../models/staff.model';

@Component({
  selector: 'app-staff-form',
  templateUrl: './staff-form.component.html',
  styleUrl: './staff-form.component.css',
  standalone: false
})
export class StaffFormComponent implements OnInit {
  role!: string;
  title!: string;
  form!: FormGroup;
  id?: number;
  staff?: Staff;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private svc: StaffService
  ) {}

  ngOnInit(): void {
    this.role = this.route.snapshot.data['role'];
    this.title = this.route.snapshot.data['title'];
    this.id = this.route.snapshot.params['id'];

    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    if (this.id) {
      this.svc.get(this.id).subscribe(d => {
        this.staff = d;
        this.form.patchValue(d);
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    const dto = { ...this.form.value, role: this.role };

    if (this.id) {
      this.svc.update(this.id, dto).subscribe(() => this.router.navigate([`/admin/${this.role.toLowerCase()}s`]));
    } else {
      this.svc.create(dto).subscribe(() => this.router.navigate([`/admin/${this.role.toLowerCase()}s`]));
    }
  }

  cancel() {
    this.router.navigate([`/admin/${this.role.toLowerCase()}s`]);
  }
}
