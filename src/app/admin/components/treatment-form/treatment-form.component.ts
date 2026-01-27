import { Component, OnInit } from '@angular/core';
import { TreatmentsService } from '../../services/treatment.service';   
import { TreatmentVm, CreateTreatmentDto, UpdateTreatmentDto, TreatmentGroupVm } from '../../models/treatment.models';
import { TreatmentGroupService } from '../../services/treatment-groups.service';  
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-treatment-form',
  templateUrl: './treatment-form.component.html',
  standalone: false
})
export class TreatmentFormComponent implements OnInit {
  model: TreatmentVm = { id: 0, treatmentName: '', price: 0, isActive: true, treatmentGroupId: 0, cost: 0};
  groups: TreatmentGroupVm[] = [];

  constructor(
    private treatmentsService: TreatmentsService,
    private groupsService: TreatmentGroupService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    // 1. Tedavi gruplarını yükle
    this.groupsService.list().subscribe(data => {
      this.groups = data.filter(g => g.isActive);
    });

    // 2. Eğer id varsa düzenleme için mevcut tedaviyi getir
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.treatmentsService.get(+id).subscribe(data => {
        console.log('Backend\'ten gelen otel:', data);
        this.model = data;
      });
    }
  }

  save() {
    if (this.model.id === 0) {
      const dto: CreateTreatmentDto = {
        treatmentName: this.model.treatmentName,
        price: this.model.price,
        cost: this.model.cost,
        isActive: this.model.isActive,
        treatmentGroupId: this.model.treatmentGroupId
      };
      this.treatmentsService.create(dto).subscribe(() => alert('Tedavi eklendi'));
      this.router.navigate(['/admin/treatments']);
    } else {
      const dto: UpdateTreatmentDto = {
        treatmentName: this.model.treatmentName,
        price: this.model.price,
        cost: this.model.cost,
        isActive: this.model.isActive,
        treatmentGroupId: this.model.treatmentGroupId
      };
      this.treatmentsService.update(this.model.id, dto).subscribe(() => alert('Tedavi güncellendi'));
      this.router.navigate(['/admin/treatments']);
    }
  }

    cancel() {
    this.router.navigate(['/admin/treatments']);
  }
}
