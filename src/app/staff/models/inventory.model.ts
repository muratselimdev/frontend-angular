export interface Inventory {
  id: number;
  customerId: number;
  staffId: number;
  requestId: number;
  ficheNo: string;
  status: number;
  type: number;
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
}

export interface CreateInventoryRequest {
  customerId: number;
  staffId: number;
  requestId: number;
  ficheNo: string;
  type: number;
  lines: CreateInventoryLineRequest[];
}

export interface CreateInventoryLineRequest {
  inventoryItemId: number;
  quantity: number;
  amount?: number | null;
}

export interface UpdateInventoryRequest {
  customerId?: number;
  staffId?: number;
  requestId?: number;
  status?: number;
  type?: number;
  lines: UpdateInventoryLineRequest[];
}

export interface UpdateInventoryLineRequest {
  inventoryItemId: number;
  quantity: number;
  amount?: number | null;
  cancel?: boolean;
  cancelReason?: string | null;
}

export interface InventoryItem {
  id: number;
  name: string;
  costPrice?: number | null;
  sellingPrice?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export type CreateInventoryDto = CreateInventoryRequest;
export type UpdateInventoryDto = UpdateInventoryRequest;
