import { Component, OnInit } from '@angular/core';
import { HospitalService } from '../../services/hospital.service';
import { Hospital } from '../../models/hospital.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hospitals-list',
  templateUrl: './hospitals-list.component.html',
  styleUrl: './hospitals-list.component.css',
  standalone: false
})
export class HospitalsListComponent implements OnInit {
  hospitals: Hospital[] = [];
  loading = false;

  constructor(private svc: HospitalService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.list().subscribe({
      next: res => { this.hospitals = res; this.loading = false; },
      error: _ => this.loading = false
    });
  }

  addNew() {
    this.router.navigate(['/admin/hospitals/new']);
  }

  edit(h: Hospital) {
    this.router.navigate(['/admin/hospitals', h.id]);
  }

  toggleActive(h: Hospital) {
    this.svc.update(h.id, { isActive: !h.isActive }).subscribe(() => this.load());
  }
}
