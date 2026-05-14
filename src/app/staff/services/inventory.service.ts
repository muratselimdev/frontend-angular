import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateInventoryRequest,
  Inventory,
  InventoryItem,
  InventoryLine,
  RequestInfo,
  UpdateInventoryRequest
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
type ApiInventoryResponse = Omit<Inventory, 'lines'> & {
  lines?: ApiArrayResponse<InventoryLine> | null;
  Lines?: ApiArrayResponse<InventoryLine> | null;
  imageUrl?: string | null;
  ImageUrl?: string | null;
};
type ApiInventoryItemResponse = Record<string, unknown>;
type ApiFicheNoResponse = { ficheNo?: string; FicheNo?: string };

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
      .get<ApiArrayResponse<Record<string, unknown>>>(`${this.baseUrl}/info`)
      .pipe(map((response) => this.normalizeArray(response).map((item) => this.normalizeRequestInfo(item))));
  }

  getItems(): Observable<InventoryItem[]> {
    return this.http
      .get<ApiArrayResponse<ApiInventoryItemResponse>>(`${this.baseUrl}/item`)
      .pipe(
        catchError(() => this.http.get<ApiArrayResponse<ApiInventoryItemResponse>>(`${this.baseUrl}/items`)),
        map((response) =>
          this.normalizeArray(response)
            .map((item) => this.normalizeInventoryItem(item))
            .filter((item) => item.id > 0)
        )
      );
  }

  getNewFicheNo(): Observable<string> {
    return this.http
      .get<ApiFicheNoResponse>(`${this.baseUrl}/ficheno`)
      .pipe(map((response) => response.ficheNo ?? response.FicheNo ?? ''));
  }

  create(payload: CreateInventoryRequest, documentFile?: File | null): Observable<Inventory> {
    return this.http
      .post<ApiInventoryResponse>(`${this.baseUrl}/create`, this.toInventoryFormData(payload, documentFile))
      .pipe(map((response) => this.normalizeInventory(response)));
  }

  update(id: number, payload: UpdateInventoryRequest, documentFile?: File | null): Observable<Inventory> {
    return this.http
      .put<ApiInventoryResponse>(`${this.baseUrl}/update/${id}`, this.toInventoryFormData(payload, documentFile))
      .pipe(map((response) => this.normalizeInventory(response)));
  }

  private normalizeInventory(response: ApiInventoryResponse): Inventory {
    return {
      ...response,
      imageUrl: this.pickString(response as Record<string, unknown>, ['imageUrl', 'ImageUrl']) ?? null,
      lines: this.normalizeArray(response.lines ?? response.Lines)
    };
  }

  private toInventoryFormData(
    payload: CreateInventoryRequest | UpdateInventoryRequest,
    documentFile?: File | null
  ): FormData {
    const formData = new FormData();

    this.appendFormValue(formData, 'Id', 'id' in payload ? payload.id : undefined);
    this.appendFormValue(formData, 'CustomerId', payload.customerId);
    this.appendFormValue(formData, 'StaffId', payload.staffId);
    this.appendFormValue(formData, 'RequestId', payload.requestId);
    this.appendFormValue(formData, 'FicheNo', payload.ficheNo);
    this.appendFormValue(formData, 'ImageUrl', payload.imageUrl);
    this.appendFormValue(formData, 'Status', payload.status);
    this.appendFormValue(formData, 'Type', payload.type);
    this.appendFormValue(formData, 'CreatedAt', payload.createdAt);
    this.appendFormValue(formData, 'UpdatedAt', payload.updatedAt);

    payload.lines.forEach((line, index) => {
      const prefix = `Lines[${index}]`;
      this.appendFormValue(formData, `${prefix}.Id`, 'id' in line ? line.id : undefined);
      this.appendFormValue(formData, `${prefix}.InventoryId`, line.inventoryId);
      this.appendFormValue(formData, `${prefix}.InventoryItemId`, line.inventoryItemId);
      this.appendFormValue(formData, `${prefix}.Quantity`, line.quantity);
      this.appendFormValue(formData, `${prefix}.Amount`, line.amount);
      this.appendFormValue(formData, `${prefix}.Cancel`, line.cancel);
      this.appendFormValue(formData, `${prefix}.CancelReason`, line.cancelReason);
      this.appendFormValue(formData, `${prefix}.CreatedAt`, line.createdAt);
      this.appendFormValue(formData, `${prefix}.UpdatedAt`, line.updatedAt);
    });

    if (documentFile) {
      formData.append('image', documentFile, documentFile.name);
    }

    return formData;
  }

  private appendFormValue(
    formData: FormData,
    key: string,
    value: string | number | boolean | null | undefined
  ): void {
    if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  }

  private normalizeInventoryItem(response: ApiInventoryItemResponse): InventoryItem {
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
      ]) ?? `Ürün #${id}`;
    const costPrice = this.pickNumber(response, [
      'costPrice',
      'CostPrice',
      'cost',
      'Cost',
      'purchasePrice',
      'PurchasePrice',
      'buyingPrice',
      'BuyingPrice'
    ]);
    const sellingPrice = this.pickNumber(response, [
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
    ]);

    return {
      id,
      name,
      costPrice,
      sellingPrice,
      isActive: this.pickBoolean(response, ['isActive', 'IsActive', 'active', 'Active']) ?? true,
      createdAt: this.pickString(response, ['createdAt', 'CreatedAt']),
      updatedAt: this.pickString(response, ['updatedAt', 'UpdatedAt'])
    };
  }

  private normalizeRequestInfo(response: Record<string, unknown>): RequestInfo {
    return {
      requestId: this.pickNumber(response, ['requestId', 'RequestId', 'id', 'Id']) ?? 0,
      customerId: this.pickNumber(response, ['customerId', 'CustomerId']) ?? 0,
      customerName: this.pickString(response, ['customerName', 'CustomerName']) ?? '',
      treatmentId: this.pickNumber(response, ['treatmentId', 'TreatmentId']) ?? 0,
      treatmentName: this.pickString(response, ['treatmentName', 'TreatmentName']) ?? '',
      treatmentGroupName: this.pickString(response, ['treatmentGroupName', 'TreatmentGroupName']) ?? null,
      assignedAgentId: this.pickNumber(response, ['assignedAgentId', 'AssignedAgentId']),
      assignedAgentName: this.pickString(response, ['assignedAgentName', 'AssignedAgentName']) ?? null,
      status: response['status'] as number | string | null | undefined,
      statusId: this.pickNumber(response, ['statusId', 'StatusId']),
      statusName: this.pickString(response, ['statusName', 'StatusName']) ?? null,
      isCancelled: this.pickBoolean(response, ['isCancelled', 'IsCancelled']),
      Status: response['Status'] as number | string | null | undefined,
      StatusId: this.pickNumber(response, ['StatusId']),
      StatusName: this.pickString(response, ['StatusName']) ?? null,
      IsCancelled: this.pickBoolean(response, ['IsCancelled'])
    };
  }

  private normalizeArray<T>(response: ApiArrayResponse<T> | null | undefined): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!response) {
      return [];
    }

    const arrayCandidates = [response.$values, response.values, response.Values];
    for (const candidate of arrayCandidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    const nestedCandidates = [
      response.data,
      response.Data,
      response.items,
      response.Items,
      response.result,
      response.Result,
      response.value,
      response.Value
    ];
    for (const candidate of nestedCandidates) {
      if (candidate) {
        return this.normalizeArray(candidate);
      }
    }

    return [];
  }

  private pickString(record: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return undefined;
  }

  private pickNumber(record: Record<string, unknown>, keys: string[]): number | null {
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

  private pickBoolean(record: Record<string, unknown>, keys: string[]): boolean | null {
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
        if (normalizedValue === 'true') {
          return true;
        }
        if (normalizedValue === 'false') {
          return false;
        }
      }
    }

    return null;
  }
}
