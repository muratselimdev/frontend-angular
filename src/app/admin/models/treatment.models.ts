// TEDAVİ GRUPLARI
export interface TreatmentGroupVm {
  id: number;
  groupName: string;
  isActive: boolean;
}

export interface CreateTreatmentGroupDto {
  groupName: string;
  isActive: boolean;
}

export interface UpdateTreatmentGroupDto {
  groupName: string;
  isActive: boolean;
}

// TEDAVİLER
export interface TreatmentVm {
  id: number;
  treatmentName: string;
  price: number;
  cost: number;              
  isActive: boolean;
  treatmentGroupId: number;
  treatmentGroupName?: string;
}

export interface CreateTreatmentDto {
  treatmentName: string;
  price: number;
  cost: number;             
  isActive: boolean;
  treatmentGroupId: number;
}

export interface UpdateTreatmentDto {
  treatmentName: string;
  price: number;
  cost: number;             
  isActive: boolean;
  treatmentGroupId: number;
}
