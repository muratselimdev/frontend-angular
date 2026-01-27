import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TreatmentGroupService } from '../../services/treatment-groups.service';
import { TreatmentGroupVm, CreateTreatmentGroupDto, UpdateTreatmentGroupDto } from '../../models/treatment.models';

@Component({
  selector: 'app-treatment-group-form',
  templateUrl: './treatment-group-form.component.html',
  standalone: false
})
export class TreatmentGroupFormComponent implements OnInit {
  model: TreatmentGroupVm = { id: 0, groupName: '', isActive: true };

  constructor(
    private groupsService: TreatmentGroupService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.groupsService.get(+id).subscribe(data => this.model = data);
    }
  }

  save() {
    if (this.model.id === 0) {
      const dto: CreateTreatmentGroupDto = { groupName: this.model.groupName, isActive: this.model.isActive };
      this.groupsService.create(dto).subscribe(() => alert('Tedavi grubu eklendi'));
      this.router.navigate(['/admin/treatment-groups']);
    } else {
      const dto: UpdateTreatmentGroupDto = { groupName: this.model.groupName, isActive: this.model.isActive };
      this.groupsService.update(this.model.id, dto).subscribe(() => alert('Tedavi grubu güncellendi'));
      this.router.navigate(['/admin/treatment-groups']);
    }
  }

    cancel() {
    this.router.navigate(['/admin/treatment-groups']);
  }
}
