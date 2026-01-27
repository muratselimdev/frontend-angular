import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { StaffAuthResponse } from '../../../auth/auth.models';
import { Staff } from '../../models/staff.model';

@Component({
  selector: 'app-translators-list',
  templateUrl: './translators-list.component.html',
  styleUrl: './translators-list.component.css',
  standalone: false
})
export class TranslatorsListComponent implements OnInit {
  items: any[] = [];
  loading = false;

  constructor(private staff: StaffService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.staff.listByRole('Translator').subscribe({
      next: res => { this.items = res; this.loading = false; },
      error: _ => { this.loading = false; }
    });
  }

  addNew() {
    this.router.navigate(['/admin/translators/new']);
  }

  edit(id: number) {
    this.router.navigate(['/admin/translators', id]);
  }

  toggleActive(c: Staff) {
    this.staff.update(c.id, { isActive: !c.isActive }).subscribe(() => this.load());
  }
}
