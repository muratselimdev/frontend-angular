import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageGroupService } from '../../services/language-group.service';
import { LanguageGroup } from '../../models/language-group.model';

@Component({
  selector: 'app-language-groups-list',
  templateUrl: './language-groups-list.component.html',
  styleUrl: './language-groups-list.component.css',
  standalone: false
})
export class LanguageGroupsListComponent implements OnInit {
  items: LanguageGroup[] = [];
  loading = false;

  constructor(private svc: LanguageGroupService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.list().subscribe({
      next: res => { this.items = res; this.loading = false; },
      error: _ => this.loading = false
    });
  }

  toggleActive(item: LanguageGroup) {
    this.svc.update(item.id, { isActive: !item.isActive })
      .subscribe(() => this.load());
  }

  edit(item: LanguageGroup) {
    this.router.navigate(['/admin/language-groups', item.id]);
  }

  addNew() {
    this.router.navigate(['/admin/language-groups/new']);
  }
}
