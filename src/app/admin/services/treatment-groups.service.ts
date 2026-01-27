import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TreatmentGroupVm, CreateTreatmentGroupDto, UpdateTreatmentGroupDto } from '../models/treatment.models';

@Injectable({ providedIn: 'root' })
export class TreatmentGroupService {
  private base = `${environment.apiUrl}/api/admin/treatmentgroups`;

  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<TreatmentGroupVm[]>(this.base);
  }

  get(id: number) {
    return this.http.get<TreatmentGroupVm>(`${this.base}/${id}`);
  }

  create(dto: CreateTreatmentGroupDto) {
    return this.http.post<TreatmentGroupVm>(this.base, dto);
  }

  update(id: number, dto: UpdateTreatmentGroupDto) {
    return this.http.put<TreatmentGroupVm>(`${this.base}/${id}`, dto);
  }

  toggle(id: number) {
    return this.http.patch<TreatmentGroupVm>(`${this.base}/${id}/toggle`, {});
  }
}
