export interface StoryItem {
  id: number;
  storyId: number;
  storyLink?: string;
  isActive: boolean;
  like?: number;
  comment?: string;
  createdAt?: string;
  endDate?: string;
  fileUrl?: string;
  updatedAt?: string | Date;
}
