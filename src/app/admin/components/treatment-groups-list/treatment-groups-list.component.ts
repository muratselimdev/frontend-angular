import { Component, OnInit } from '@angular/core';
import { TreatmentGroupService } from '../../services/treatment-groups.service';
import { TreatmentGroupVm } from '../../models/treatment.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-treatment-groups-list',
  templateUrl: './treatment-groups-list.component.html',
  styleUrl: './treatment-groups-list.component.css',
  standalone: false
})
export class TreatmentGroupsListComponent implements OnInit {
  groups: TreatmentGroupVm[] = [];
  loading = false;

  constructor(private groupsService: TreatmentGroupService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.groupsService.list().subscribe(data => this.groups = data);
  }

  toggle(group: TreatmentGroupVm) {
    this.groupsService.toggle(group.id).subscribe(() => this.load());
  }

    addNew() {  
    this.router.navigate(['/admin/treatment-groups/new']);
  }

  edit(id: number) {
    this.router.navigate(['/admin/treatment-groups', id]);
  }
}
