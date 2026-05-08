import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Inventory, 
  CreateInventoryDto, 
  UpdateInventoryDto, 
  RequestInfo 
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private baseUrl = `${environment.apiUrl}/api/inventory`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.baseUrl}/all`);
  }

  getById(id: number): Observable<Inventory> {
    return this.http.get<Inventory>(`${this.baseUrl}/${id}`);
  }

  create(data: CreateInventoryDto): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.baseUrl}/create`, data);
  }

  update(id: number, data: UpdateInventoryDto): Observable<Inventory> {
    return this.http.put<Inventory>(`${this.baseUrl}/update/${id}`, data);
  }

  getInfo(): Observable<RequestInfo[]> {
    return this.http.get<RequestInfo[]>(`${this.baseUrl}/info`);
  }
}
