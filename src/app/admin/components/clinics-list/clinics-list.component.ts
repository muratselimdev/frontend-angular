import { Component, OnInit } from '@angular/core';
import { ClinicService } from '../../services/clinic.service';
import { Clinic } from '../../models/clinic.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clinics-list',
  templateUrl: './clinics-list.component.html',
  styleUrl: './clinics-list.component.css',
  standalone: false
})
export class ClinicsListComponent implements OnInit {
  clinics: Clinic[] = [];
  loading = false;

  constructor(private svc: ClinicService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.list().subscribe({
      next: res => { this.clinics = res; this.loading = false; },
      error: _ => this.loading = false
    });
  }

  addNew() {
    this.router.navigate(['/admin/clinics/new']);
  }

  edit(c: Clinic) {
    this.router.navigate(['/admin/clinics', c.id]);
  }

  toggleActive(c: Clinic) {
    this.svc.update(c.id, { isActive: !c.isActive }).subscribe(() => this.load());
  }
}
