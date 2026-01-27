export interface Campaing {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  discountRate: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}
