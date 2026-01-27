import { Component, OnInit } from '@angular/core';
import { TreatmentsService } from '../../services/treatment.service';
import { TreatmentVm } from '../../models/treatment.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-treatments-list',
  templateUrl: './treatments-list.component.html',
  styleUrl: './treatment-list.component.css',
  standalone: false
})
export class TreatmentsListComponent implements OnInit {
  treatments: TreatmentVm[] = [];

  constructor(private treatmentsService: TreatmentsService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.treatmentsService.list().subscribe(data => this.treatments = data);
  }

  toggle(t: TreatmentVm) {
    this.treatmentsService.toggle(t.id).subscribe(() => this.load());
  }

 addNew() {
    this.router.navigate(['/admin/treatments/new']);
  }

  edit(id: number) {
    this.router.navigate(['/admin/treatments', id]);
  }
}
