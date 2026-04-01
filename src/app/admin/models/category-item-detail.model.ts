export interface CategoryItemDetail {
  id: number;
  categoryItemId: number;
  label: string;
  detail?: string;
  imageUrl?: string;
  videoUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // Backward-compatibility fields for legacy templates/components
  title?: string;
  description?: string;
  content?: string;
  image?: string;
  order?: number;
}
