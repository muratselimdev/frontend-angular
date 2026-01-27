import { Component, OnInit } from '@angular/core';
import { SupervisorVm, Branch, LanguageGroup } from '../../models/staff.models';
import { SupervisorsService } from '../../services/supervisors.service';
import { LookupsService } from '../../services/lookups.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-supervisors-list',
  templateUrl: './supervisors-list.component.html',
  styleUrl: './supervisors-list.component.css',
  standalone: false
})
export class SupervisorsListComponent implements OnInit {
  list: SupervisorVm[] = [];
  branches: Branch[] = [];
  langs: LanguageGroup[] = [];
  branchId?: number;
  languageGroupId?: number;

  loading = false;

  constructor(
    private api: SupervisorsService,
    private http: HttpClient,
    private lk: LookupsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.lk.branches().subscribe(r => this.branches = r);
    this.lk.languageGroups({ isActive: true }).subscribe(r => this.langs = r);
    this.load();
  }

  load() {
    this.loading = true;
    this.api.list({ branchId: this.branchId, languageGroupId: this.languageGroupId })
      .subscribe({
        next: r => { 
          //('Backendden gelen:', r);
          this.list = r; 
          this.loading = false; },
        error: _ => { this.loading = false; }
      });
  }

  goNew()  { this.router.navigate(['/admin/supervisors/new']); }
  goEdit(id: number) { this.router.navigate(['/admin/supervisors', id]); }

  toggleActive(c: SupervisorVm) {
    this.api.update(c.id, { isActive: !c.isActive }).subscribe(() => this.load());
  }
}
