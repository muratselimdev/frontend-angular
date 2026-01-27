import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TreatmentVm, CreateTreatmentDto, UpdateTreatmentDto } from '../models/treatment.models';

@Injectable({ providedIn: 'root' })
export class TreatmentsService {
  private base = `${environment.apiUrl}/api/admin/treatments`;

  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<TreatmentVm[]>(this.base);
  }

  get(id: number) {
    return this.http.get<TreatmentVm>(`${this.base}/${id}`);
  }

  create(dto: CreateTreatmentDto) {
    return this.http.post<TreatmentVm>(this.base, dto);
  }

  update(id: number, dto: UpdateTreatmentDto) {
    return this.http.put<TreatmentVm>(`${this.base}/${id}`, dto);
  }

  toggle(id: number) {
    return this.http.patch<TreatmentVm>(`${this.base}/${id}/toggle`, {});
  }
}
