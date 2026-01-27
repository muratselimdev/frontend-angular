import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HotelVm, CreateHotelDto, UpdateHotelDto } from '../models/hotel.models';

@Injectable({ providedIn: 'root' })
export class HotelsService {
  private base = `${environment.apiUrl}/api/admin/hotels`;

  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<HotelVm[]>(this.base);
  }

  get(id: number) {
    return this.http.get<HotelVm>(`${this.base}/${id}`);
  }

  create(dto: CreateHotelDto) {
    return this.http.post<HotelVm>(this.base, dto);
  }

  update(id: number, dto: UpdateHotelDto) {
    return this.http.put<HotelVm>(`${this.base}/${id}`, dto);
  }

  toggle(id: number) {
    return this.http.patch<HotelVm>(`${this.base}/${id}/toggle`, {});
  }
}
