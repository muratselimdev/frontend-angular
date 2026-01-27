export interface HotelVm {
  id: number;
  hotelName: string;
  address: string;
  phone: string;
  star: number;
  price: number;   // ✅ Satış fiyatı (€)
  cost: number;    // ✅ Maliyet (€)
  isActive: boolean;
}

export interface CreateHotelDto {
  hotelName: string;
  address: string;
  phone: string;
  star: number;
  price: number;
  cost: number;
  isActive: boolean;
}

export interface UpdateHotelDto {
  hotelName: string;
  address: string;
  phone: string;
  star: number;
  price: number;
  cost: number;
  isActive: boolean;
}
