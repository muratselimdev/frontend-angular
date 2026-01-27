export interface PatientTransferVm {
  id: number;
  transferType: string;
  vehicleType: string;
  transferDate: string;
  notes?: string;
  isActive: boolean;
}

export interface CreatePatientTransferDto {
  transferType: string;
  vehicleType: string;
  transferDate: string;
  notes?: string;
  isActive: boolean;
}

export interface UpdatePatientTransferDto {
  transferType: string;
  vehicleType: string;
  transferDate: string;
  notes?: string;
  isActive: boolean;
}
