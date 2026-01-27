export interface StaffProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;         // backend string dönüyor (Admin, Ceo, Agent ...)
  branchId?: number | null;
  languageGroupId?: number | null;
  nickname?: string | null;
  agentLevel?: string | null;
}

export interface StaffAuthResponse {
  token: string;
  expiresAt: string;   // ISO datetime
  profile: StaffProfile;
}
