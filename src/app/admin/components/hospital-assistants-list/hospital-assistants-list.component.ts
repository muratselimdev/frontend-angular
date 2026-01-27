import { Component, OnInit } from '@angular/core';
import { StaffService } from '../../services/staff.service';
import { Router } from '@angular/router';
import { Staff } from '../../models/staff.model';

@Component({
  selector: 'app-hospital-assistants-list',
  templateUrl: './hospital-assistants-list.component.html',
  styleUrl: './hospital-assistants-list.component.css',
  standalone: false
})
export class HospitalAssistantsListComponent implements OnInit {
  items: any[] = [];
  loading = false;

  constructor(private svc: StaffService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.listByRole('HospitalAssistant').subscribe({
      next: res => {
        //console.log('Backendden gelen:', res);
        this.items = res;
        this.loading = false;
      },
      error: _ => (this.loading = false)
    });
  }

  edit(id: number) {
    this.router.navigate(['/admin/hospital-assistants', id]);
  }

  addNew() {
    this.router.navigate(['/admin/hospital-assistants/new']);
  }

  toggleActive(c: Staff) {
    this.svc.update(c.id, { isActive: !c.isActive }).subscribe(() => this.load());
  }
}
