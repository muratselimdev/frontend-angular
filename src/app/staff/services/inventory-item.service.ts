import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BulkUpdateInventoryItemCostPriceRequest,
  BulkUpdateInventoryItemCostPriceResponse,
  CreateInventoryItemRequest,
  InventoryItem,
  UpdateInventoryItemRequest
} from '../models/inventory.model';

type ApiArrayResponse<T> =
  | T[]
  | {
      $values?: T[];
      values?: T[];
      Values?: T[];
      data?: ApiArrayResponse<T>;
      Data?: ApiArrayResponse<T>;
      items?: ApiArrayResponse<T>;
      Items?: ApiArrayResponse<T>;
      result?: ApiArrayResponse<T>;
      Result?: ApiArrayResponse<T>;
      value?: ApiArrayResponse<T>;
      Value?: ApiArrayResponse<T>;
    };

type ApiRecord = Record<string, unknown>;

@Injectable({
  providedIn: 'root'
})
export class InventoryItemService {
  private readonly baseUrl = `${environment.apiUrl}/api/inventoryitem`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<InventoryItem[]> {
    return this.http
      .get<ApiArrayResponse<ApiRecord>>(`${this.baseUrl}/all`)
      .pipe(
        map((response) =>
          this.normalizeArray<ApiRecord>(response)
            .filter((item): item is ApiRecord => this.isRecord(item))
            .map((item) => this.normalizeInventoryItem(item))
        )
      );
  }

  getById(id: number): Observable<InventoryItem> {
    return this.http
      .get<ApiRecord>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => this.normalizeInventoryItem(response)));
  }

  create(payload: CreateInventoryItemRequest): Observable<InventoryItem> {
    return this.http
      .post<ApiRecord>(`${this.baseUrl}/create`, payload)
      .pipe(map((response) => this.normalizeInventoryItem(response)));
  }

  update(id: number, payload: UpdateInventoryItemRequest): Observable<InventoryItem> {
    return this.http
      .put<ApiRecord>(`${this.baseUrl}/update/${id}`, { ...payload, id })
      .pipe(map((response) => this.normalizeInventoryItem(response)));
  }

  toggle(id: number): Observable<InventoryItem> {
    return this.http
      .patch<ApiRecord>(`${this.baseUrl}/${id}/toggle`, {})
      .pipe(map((response) => this.normalizeInventoryItem(response)));
  }

  bulkUpdateCostPrice(
    payload: BulkUpdateInventoryItemCostPriceRequest
  ): Observable<BulkUpdateInventoryItemCostPriceResponse> {
    return this.http
      .put<ApiRecord>(`${this.baseUrl}/bulk-update-costprice`, payload.items)
      .pipe(map((response) => this.normalizeBulkResponse(response)));
  }

  private normalizeBulkResponse(response: ApiRecord): BulkUpdateInventoryItemCostPriceResponse {
    const updatedItemsCandidate =
      response['updatedItems'] ?? response['UpdatedItems'] ?? response['items'] ?? response['Items'];

    return {
      updatedCount: this.pickNumber(response, ['updatedCount', 'UpdatedCount']) ?? 0,
      message: this.pickString(response, ['message', 'Message']),
      notFoundCodes: this.normalizeArray(response['notFoundCodes'] ?? response['NotFoundCodes']).map((item) =>
        String(item)
      ),
      invalidRows: this.normalizeArray(response['invalidRows'] ?? response['InvalidRows']),
      updatedItems: this.normalizeArray(updatedItemsCandidate)
        .filter((item): item is ApiRecord => this.isRecord(item))
        .map((item) => this.normalizeInventoryItem(item))
    };
  }

  private normalizeInventoryItem(response: ApiRecord): InventoryItem {
    const id =
      this.pickNumber(response, ['id', 'Id', 'inventoryItemId', 'InventoryItemId', 'itemId', 'ItemId']) ?? 0;
    const name =
      this.pickString(response, [
        'name',
        'Name',
        'itemName',
        'ItemName',
        'inventoryItemName',
        'InventoryItemName',
        'productName',
        'ProductName',
        'title',
        'Title'
      ]) ?? `Sipariş Kalemi #${id}`;

    return {
      id,
      code: this.pickString(response, ['code', 'Code', 'itemCode', 'ItemCode', 'stockCode', 'StockCode']) ?? null,
      name,
      costPrice: this.pickNumber(response, [
        'costPrice',
        'CostPrice',
        'cost',
        'Cost',
        'purchasePrice',
        'PurchasePrice',
        'buyingPrice',
        'BuyingPrice'
      ]),
      sellingPrice: this.pickNumber(response, [
        'sellingPrice',
        'SellingPrice',
        'salePrice',
        'SalePrice',
        'salesPrice',
        'SalesPrice',
        'unitPrice',
        'UnitPrice',
        'price',
        'Price'
      ]),
      isActive: this.pickBoolean(response, ['isActive', 'IsActive', 'active', 'Active']) ?? true,
      createdAt: this.pickString(response, ['createdAt', 'CreatedAt']),
      updatedAt: this.pickString(response, ['updatedAt', 'UpdatedAt']) ?? null
    };
  }

  private normalizeArray<T = unknown>(response: ApiArrayResponse<T> | unknown): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!this.isRecord(response)) {
      return [];
    }

    const directCandidates = [response['$values'], response['values'], response['Values']];
    for (const candidate of directCandidates) {
      if (Array.isArray(candidate)) {
        return candidate as T[];
      }
    }

    const nestedCandidates = [
      response['data'],
      response['Data'],
      response['items'],
      response['Items'],
      response['result'],
      response['Result'],
      response['value'],
      response['Value']
    ];
    for (const candidate of nestedCandidates) {
      const nestedItems = this.normalizeArray<T>(candidate);
      if (nestedItems.length > 0) {
        return nestedItems;
      }
    }

    return [];
  }

  private pickString(record: ApiRecord, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        return value.toString();
      }
    }

    return undefined;
  }

  private pickNumber(record: ApiRecord, keys: string[]): number | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string') {
        const parsedValue = Number(value.replace(',', '.'));
        if (Number.isFinite(parsedValue)) {
          return parsedValue;
        }
      }
    }

    return null;
  }

  private pickBoolean(record: ApiRecord, keys: string[]): boolean | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'boolean') {
        return value;
      }

      if (typeof value === 'number') {
        return value === 1;
      }

      if (typeof value === 'string') {
        const normalizedValue = value.trim().toLowerCase();
        if (['true', '1', 'aktif', 'active'].includes(normalizedValue)) {
          return true;
        }
        if (['false', '0', 'pasif', 'inactive'].includes(normalizedValue)) {
          return false;
        }
      }
    }

    return null;
  }

  private isRecord(value: unknown): value is ApiRecord {
    return typeof value === 'object' && value !== null;
  }
}
