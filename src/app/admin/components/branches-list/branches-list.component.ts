import { Component, OnInit } from '@angular/core';
import { BranchService } from '../../services/branch.service';
import { Branch } from '../../models/branch.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-branches-list',
  templateUrl: './branches-list.component.html',
  styleUrl: './branches-list.component.css',
  standalone: false
})
export class BranchesListComponent implements OnInit {
  branches: Branch[] = [];
  loading = false;

  constructor(private svc: BranchService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

load() {
  this.loading = true;
  this.svc.list().subscribe({
    next: res => {
      this.branches = res;
      this.loading = false;
    },
    error: err => {
      console.error('Şube listesi alınamadı:', err);
      this.loading = false;
    }
  });
}

  toggleActive(b: Branch) {
    this.svc.update(b.id, { isActive: !b.isActive }).subscribe(() => this.load());
  }

  edit(b: Branch) {
    this.router.navigate(['/admin/branches', b.id]);
  }

  addNew() {
    this.router.navigate(['/admin/branches/new']);
  }
}
