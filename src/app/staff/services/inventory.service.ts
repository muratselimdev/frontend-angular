import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateInventoryRequest,
  Inventory,
  InventoryItem,
  InventoryLine,
  RequestInfo,
  UpdateInventoryRequest
} from '../models/inventory.model';

type ApiArrayResponse<T> = T[] | { $values?: T[] };
type ApiInventoryResponse = Omit<Inventory, 'lines'> & {
  lines?: ApiArrayResponse<InventoryLine> | null;
};

const FALLBACK_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 1,
    name: 'Dental Whitening Kit',
    costPrice: 50,
    sellingPrice: 150,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    name: 'Implant Screw',
    costPrice: 200,
    sellingPrice: 500,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 3,
    name: 'Porcelain Crown',
    costPrice: 100,
    sellingPrice: 300,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 4,
    name: 'Post-op Care Pack',
    costPrice: 35,
    sellingPrice: 90,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly baseUrl = `${environment.apiUrl}/api/inventory`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Inventory[]> {
    return this.http
      .get<ApiArrayResponse<ApiInventoryResponse>>(`${this.baseUrl}/all`)
      .pipe(map((response) => this.normalizeArray(response).map((item) => this.normalizeInventory(item))));
  }

  getById(id: number): Observable<Inventory> {
    return this.http
      .get<ApiInventoryResponse>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => this.normalizeInventory(response)));
  }

  getInfo(): Observable<RequestInfo[]> {
    return this.http
      .get<ApiArrayResponse<RequestInfo>>(`${this.baseUrl}/info`)
      .pipe(map((response) => this.normalizeArray(response)));
  }

  create(payload: CreateInventoryRequest): Observable<Inventory> {
    return this.http
      .post<ApiInventoryResponse>(`${this.baseUrl}/create`, payload)
      .pipe(map((response) => this.normalizeInventory(response)));
  }

  update(id: number, payload: UpdateInventoryRequest): Observable<Inventory> {
    return this.http
      .put<ApiInventoryResponse>(`${this.baseUrl}/update/${id}`, payload)
      .pipe(map((response) => this.normalizeInventory(response)));
  }

  getFallbackInventoryItems(): InventoryItem[] {
    // TODO: Replace mock items with real inventory items endpoint when backend exposes it.
    return FALLBACK_INVENTORY_ITEMS.map((item) => ({ ...item }));
  }

  private normalizeInventory(response: ApiInventoryResponse): Inventory {
    return {
      ...response,
      lines: this.normalizeArray(response.lines)
    };
  }

  private normalizeArray<T>(response: ApiArrayResponse<T> | null | undefined): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response?.$values && Array.isArray(response.$values)) {
      return response.$values;
    }

    return [];
  }
}
