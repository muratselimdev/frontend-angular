export interface Staff {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  branch?: string;
  clinic?: string;
  hospital?: string;
  languageGroup?: string;
  isActive: boolean;
}
