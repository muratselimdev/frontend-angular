export interface Inventory {
  id: number;
  staffId: number;
  requestId: number;
  ficheNo: string;
  customerId: number;
  status: number;
  type: number;
  createdAt: string;
  updatedAt?: string;
  lines: InventoryLine[];
}

export interface InventoryLine {
  id?: number;
  inventoryId?: number;
  inventoryItemId: number;
  quantity: number;
  amount: number;
  cancel: boolean;
  cancelReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: number;
  inventoryLineId?: number;
  name: string;
  costPrice?: number;
  sellingPrice?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateInventoryDto {
  customerId: number;
  staffId: number;
  requestId: number;
  ficheNo: string;
  status: number;
  type: number;
  lines: CreateInventoryLineDto[];
}

export interface CreateInventoryLineDto {
  inventoryItemId: number;
  quantity: number;
  amount: number;
}

export interface UpdateInventoryDto {
  customerId?: number;
  staffId?: number;
  requestId?: number;
  status?: number;
  type?: number;
  lines: InventoryLine[];
}

export interface RequestInfo {
  requestId: number;
  customerId: number;
  customerName: string;
  treatmentId: number;
  treatmentName: string;
  treatmentGroupName: string;
  assignedAgentId: number;
  assignedAgentName: string;
}
