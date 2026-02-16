export interface CategoryItemDetail {
  id: number;
  categoryItemId: number;
  title: string;
  description: string;
  content?: string;
  image?: string;
  order?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
