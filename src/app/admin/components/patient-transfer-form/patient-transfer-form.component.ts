import { Component, OnInit } from '@angular/core';
import { PatientTransfersService } from '../../services/patient-transfers.service';
import { PatientTransferVm } from '../../models/patient-transfer.models';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-patient-transfer-form',
  templateUrl: './patient-transfer-form.component.html',
  standalone: false
})
export class PatientTransferFormComponent implements OnInit {
  model: PatientTransferVm = { id: 0, transferType: '', vehicleType: '', transferDate: '', notes: '', isActive: true };

  constructor(
    private transfersService: PatientTransfersService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.transfersService.get(+id).subscribe(data => {
        this.model = data;
      });
    }
  }

  save() {
    if (this.model.id === 0) {
      this.transfersService.create(this.model).subscribe(() => alert('Transfer eklendi'));
      this.router.navigate([`/admin/patient-transfers`]);
    } else {
      this.transfersService.update(this.model.id, this.model).subscribe(() => alert('Transfer güncellendi'));
      this.router.navigate([`/admin/patient-transfers`]);
    }
  }
  
  cancel() {
    this.router.navigate([`/admin/patient-transfers`]);
  }
}
