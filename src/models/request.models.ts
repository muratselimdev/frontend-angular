export interface AttachmentDto {
  filePath: string;
  fileType: string;
  attachmentCategory: string; // Document / Image
}

export interface MessageDto {
  id: number;
  content: string;
  createdAt: string;
  senderName: string;
  senderRole: string;
}

export interface RequestDetailDto {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  customerName: string;
  documents: AttachmentDto[];
  images: AttachmentDto[];
  messages: MessageDto[];
}

export interface RequestDto {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  customerName: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CustomerRequestDetail {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  customerName: string;
  documents: AttachmentDto[];
  images: AttachmentDto[];
  messages: MessageDto[];
}
