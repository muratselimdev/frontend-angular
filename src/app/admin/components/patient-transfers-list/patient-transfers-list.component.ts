import { Component, OnInit } from '@angular/core';
import { PatientTransfersService } from '../../services/patient-transfers.service';
import { PatientTransferVm } from '../../models/patient-transfer.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-transfers-list',
  templateUrl: './patient-transfers-list.component.html',
  styleUrl: './patient-transfers-list.component.css',
  standalone: false
})
export class PatientTransfersListComponent implements OnInit {
  transfers: PatientTransferVm[] = [];

  constructor(private transfersService: PatientTransfersService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.transfersService.list().subscribe(data => this.transfers = data);
  }

  toggle(t: PatientTransferVm) {
    this.transfersService.toggle(t.id).subscribe(() => this.load());
  }

  addNew() {
    this.router.navigate(['/admin/patient-transfers/new']);
  }

  edit(id: number) {
    this.router.navigate(['/admin/patient-transfers', id]);
  }
}
