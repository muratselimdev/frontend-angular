import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { Staff } from '../../models/staff.model';

@Component({
  selector: 'app-doctors-list',
  templateUrl: './doctors-list.component.html',
  styleUrl: './doctors-list.component.css',
  standalone: false
})
export class DoctorsListComponent implements OnInit {
  doctors: Staff[] = [];
  loading = false;

  constructor(private svc: StaffService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.listByRole('Doctor').subscribe({
      next: res => {
        this.doctors = res;
        this.loading = false;
      },
      error: _ => (this.loading = false)
    });
  }

  toggleActive(d: Staff) {
    this.svc.update(d.id, { isActive: !d.isActive }).subscribe(() => this.load());
  }

  edit(d: Staff) {
    this.router.navigate(['/admin/doctors', d.id]);
  }

  addNew() {
    this.router.navigate(['/admin/doctors/new']);
  }
}
