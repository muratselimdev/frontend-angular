import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PatientTransferVm, CreatePatientTransferDto, UpdatePatientTransferDto } from '../models/patient-transfer.models';

@Injectable({ providedIn: 'root' })
export class PatientTransfersService {
  private base = `${environment.apiUrl}/api/admin/patienttransfers`;

  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<PatientTransferVm[]>(this.base);
  }

  get(id: number) {
    return this.http.get<PatientTransferVm>(`${this.base}/${id}`);
  }

  create(dto: CreatePatientTransferDto) {
    return this.http.post<PatientTransferVm>(this.base, dto);
  }

  update(id: number, dto: UpdatePatientTransferDto) {
    return this.http.put<PatientTransferVm>(`${this.base}/${id}`, dto);
  }

  toggle(id: number) {
    return this.http.patch<PatientTransferVm>(`${this.base}/${id}/toggle`, {});
  }
}
