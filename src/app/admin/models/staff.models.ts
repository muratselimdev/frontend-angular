export enum StaffRole {
  Admin = 'Admin',
  Ceo = 'Ceo',
  SalesManager = 'SalesManager',
  Supervisor = 'Supervisor',
  Agent = 'Agent',
  PlanningManager = 'PlanningManager',
  TranslatorLead = 'TranslatorLead',
  Translator = 'Translator'
}

export enum AgentLevel {
  Beginner = 0,
  Junior = 1,
  Senior = 2
}

export interface Branch {
  id: number;
  name: string;
  isActive: boolean;
}

export interface LanguageGroup {
  id: number;
  code: string;
  name?: string;
}

export interface SupervisorVm {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  branchId: number;
  branchName?: string;
  languageGroupId: number;
  lang?: string;
  nickname?: string;
  agentCount?: number;
}

export interface CreateSupervisorDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  branchId: number;
  languageGroupId: number;
  nickname?: string;
}

export interface UpdateSupervisorDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  branchId?: number;
  languageGroupId?: number;
  nickname?: string;
  isActive?: boolean;
}

export interface AgentVm {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nickname?: string;
  isActive: boolean;
  presenceStatus: string;
  //presenceStatus?: 'Online' | 'Busy' | 'Offline' | string;

  branchId: number;
  branch: string;

  languageGroupId: number;
  languageGroup: string;

  supervisorId: number;
  supervisorName?: string;

  agentLevelId: number;         // Backend int (0,1,2)
  agentLevel: string;     // Backend string ("Acemi","Junior","Senior")
}

// export interface AgentVm {
//   id: number;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone?: string;
//   isActive: boolean;
//   branchId: number;
//   branchName?: string;
//   languageGroupId: number;
//   lang?: string;
//   supervisorId?: number;
//   supervisorName?: string | null;
//   agentLevel?: AgentLevel;
//   nickname?: string;
// }

export interface CreateAgentDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  branchId: number;
  languageGroupId: number;
  supervisorId: number;
  agentLevel: AgentLevel;
  nickname?: string;
}

export interface UpdateAgentDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  branchId?: number;
  languageGroupId?: number;
  supervisorId?: number;
  agentLevel?: AgentLevel;
  nickname?: string;
  isActive?: boolean;
}
