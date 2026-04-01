export interface Story {
  id: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  endDate?: string;
  temp?: boolean;
  updatedAt?: string | Date;
}
