import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { Staff } from '../../models/staff.model';

@Component({
  selector: 'app-staffs-list',
  templateUrl: './staffs-list.component.html',
  styleUrl: './staffs-list.component.css',
  standalone: false
})
export class StaffsListComponent implements OnInit {
  role!: string;
  title!: string;
  staff: Staff[] = [];
  loading = false;

  constructor(
    private svc: StaffService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.role = this.route.snapshot.data['role'];
    this.title = this.route.snapshot.data['title'];
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.listByRole(this.role).subscribe({
      next: res => { this.staff = res; this.loading = false; },
      error: _ => this.loading = false
    });
  }

  addNew() {
    this.router.navigate([`/admin/${this.role.toLowerCase()}s/new`]);
  }

  edit(s: Staff) {
    this.router.navigate([`/admin/${this.role.toLowerCase()}s`, s.id]);
  }

  toggleActive(s: Staff) {
    this.svc.update(s.id, { isActive: !s.isActive }).subscribe(() => this.load());
  }
}
