export type InventoryStatusApi = 'DevamEdiyor' | 'Tamamlandi' | 'IptalEdildi';
export type InventoryTypeApi = 'Satinalma' | 'Satis';

export interface Inventory {
  id: number;
  customerId: number;
  staffId: number;
  requestId: number;
  ficheNo: string;
  status: number | InventoryStatusApi;
  type: number | InventoryTypeApi;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  lines: InventoryLine[];
}

export interface InventoryLine {
  id?: number;
  inventoryId?: number;
  inventoryItemId: number;
  quantity: number;
  amount?: number | null;
  cancel?: boolean;
  cancelReason?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface RequestInfo {
  requestId: number;
  customerId: number;
  customerName: string;
  treatmentId: number;
  treatmentName: string;
  treatmentGroupName?: string | null;
  assignedAgentId?: number | null;
  assignedAgentName?: string | null;
  status?: number | string | null;
  statusId?: number | null;
  statusName?: string | null;
  isCancelled?: boolean | null;
  Status?: number | string | null;
  StatusId?: number | null;
  StatusName?: string | null;
  IsCancelled?: boolean | null;
}

export interface CreateInventoryRequest {
  customerId: number;
  staffId: number;
  requestId: number;
  ficheNo: string;
  status: InventoryStatusApi;
  type: InventoryTypeApi;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string | null;
  lines: CreateInventoryLineRequest[];
}

export interface CreateInventoryLineRequest {
  inventoryId: number;
  inventoryItemId: number;
  quantity: number;
  amount?: number | null;
  cancel: boolean;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateInventoryRequest {
  id?: number;
  customerId?: number;
  staffId?: number;
  requestId?: number;
  ficheNo?: string;
  imageUrl?: string | null;
  status?: InventoryStatusApi;
  type?: InventoryTypeApi;
  createdAt?: string;
  updatedAt?: string;
  lines: UpdateInventoryLineRequest[];
}

export interface UpdateInventoryLineRequest {
  id?: number;
  inventoryId?: number;
  inventoryItemId: number;
  quantity: number;
  amount?: number | null;
  cancel?: boolean;
  cancelReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: number;
  code?: string | null;
  name: string;
  costPrice?: number | null;
  sellingPrice?: number | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreateInventoryItemRequest {
  code?: string | null;
  name: string;
  costPrice: number;
  sellingPrice: number;
  isActive?: boolean;
}

export interface UpdateInventoryItemRequest {
  id?: number;
  code?: string | null;
  name: string;
  costPrice: number;
  sellingPrice: number;
  isActive?: boolean;
}

export interface BulkUpdateInventoryItemCostPriceRequest {
  items: BulkUpdateInventoryItemCostPriceItem[];
}

export interface BulkUpdateInventoryItemCostPriceItem {
  code: string;
  costPrice: number;
}

export interface BulkUpdateInventoryItemCostPriceResponse {
  updatedCount: number;
  message?: string;
  notFoundCodes?: string[];
  invalidRows?: unknown[];
  updatedItems?: InventoryItem[];
}

export type CreateInventoryDto = CreateInventoryRequest;
export type UpdateInventoryDto = UpdateInventoryRequest;
