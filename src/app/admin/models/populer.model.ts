export interface Populer {
  id: number;
  title: string;
  rating: number;
  price: number;
  reviews: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  isActive: boolean;
  imageUrl?: string;
  image?: string;
}
