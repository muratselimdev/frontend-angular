import { Component, OnInit } from '@angular/core';
import { StaffService } from '../../services/staff.service';
import { Router } from '@angular/router';
import { Staff } from '../../models/staff.model';

@Component({
  selector: 'app-hospital-managers-list',
  templateUrl: './hospital-managers-list.component.html',
  styleUrl: './hospital-managers-list.component.css',
  standalone: false
})
export class HospitalManagersListComponent implements OnInit {
  items: any[] = [];
  loading = false;

  constructor(private svc: StaffService, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.listByRole('HospitalManager').subscribe({
      next: res => { this.items = res; this.loading = false; },
      error: _ => this.loading = false
    });
  }

  edit(id: number) {
    this.router.navigate(['/admin/hospital-managers', id]);
  }

  addNew() {
    this.router.navigate(['/admin/hospital-managers/new']);
  }

  toggleActive(c: Staff) {
    this.svc.update(c.id, { isActive: !c.isActive }).subscribe(() => this.load());
  }
}
