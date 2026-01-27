import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { Staff } from '../../models/staff.model';

@Component({
  selector: 'app-translator-leads-list',
  templateUrl: './translator-leads-list.component.html',
  styleUrl: './translator-leads.list.component.scss',
  standalone: false
})
export class TranslatorLeadsListComponent implements OnInit {
  items: any[] = [];
  loading = false;

  constructor(private staff: StaffService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.staff.listByRole('TranslatorLead').subscribe({
      next: res => { this.items = res; this.loading = false; },
      error: _ => { this.loading = false; }
    });
  }

  addNew() {
    this.router.navigate(['/admin/translator-leads/new']);
  }

  edit(id: number) {
    this.router.navigate(['/admin/translator-leads', id]);
  }

  toggleActive(c: Staff) {
    this.staff.update(c.id, { isActive: !c.isActive }).subscribe(() => this.load());
  }
}
