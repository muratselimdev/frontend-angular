export interface AgentCall {
  customerConnectionId: null;
  id: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  isUnassigned?: boolean;
  assignedAt?: string;
  assignedById?: number;
  agentId?: number;
  agent?: {
    id: number;
    firstName: string;
    lastName: string;
    nickName: string;
  };
  clinic?: { id: number; name: string };
  hospital?: { id: number; name: string };
  hotel?: { id: number; hotelName: string };
}
