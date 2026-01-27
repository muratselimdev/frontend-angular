export interface Staff {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  branchId?: number;
  branch?: string;
  languageGroupId?: number;
}
