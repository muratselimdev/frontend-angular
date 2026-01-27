import { Component, OnInit } from '@angular/core';
import { StaffService } from '../../services/staff.service';
import { Router } from '@angular/router';
import { Staff } from '../../models/staff.model';

@Component({
  selector: 'app-dental-assistants-list',
  templateUrl: './dental-assistants-list.component.html',
  styleUrl: './dental-assistants-list.component.css',
  standalone: false
})
export class DentalAssistantsListComponent implements OnInit {
  items: any[] = [];
  loading = false;

  constructor(private svc: StaffService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.listByRole('DentalAssistant').subscribe({
      next: res => {
        this.items = res;
        this.loading = false;
      },
      error: _ => (this.loading = false)
    });
  }

  edit(id: number) {
    this.router.navigate(['/admin/dental-assistants', id]);
  }

  addNew() {
    this.router.navigate(['/admin/dental-assistants/new']);
  }

  toggleActive(c: Staff) {
    this.svc.update(c.id, { isActive: !c.isActive }).subscribe(() => this.load());
  }
}
