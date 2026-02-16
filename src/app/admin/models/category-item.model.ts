export interface CategoryItem {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  icon?: string;
  image?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
