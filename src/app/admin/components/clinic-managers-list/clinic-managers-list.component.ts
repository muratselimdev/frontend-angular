import { Component, OnInit } from '@angular/core';
import { StaffService } from '../../services/staff.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clinic-managers-list',
  templateUrl: './clinic-managers-list.component.html',
  styleUrl: './clinic-managers-list.component.css',
  standalone: false
})
export class ClinicManagersListComponent implements OnInit {
  items: any[] = [];
  loading = false;

  constructor(private svc: StaffService, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.listByRole('ClinicManager').subscribe({
      next: res => { this.items = res; this.loading = false; },
      error: _ => this.loading = false
    });
  }

  edit(id: number) {
    this.router.navigate(['/admin/clinic-managers', id]);
  }

  addNew() {
    this.router.navigate(['/admin/clinic-managers/new']);
  }
}
