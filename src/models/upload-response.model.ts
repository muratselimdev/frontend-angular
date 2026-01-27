export interface UploadResponseProgress {
  status: 'progress';
  progress: number;
}

export interface UploadResponseDone {
  status: 'done';
  body: any;
}

export interface UploadResponseEvent {
  status: 'event';
  event: any;
}

export type UploadResponse = UploadResponseProgress | UploadResponseDone | UploadResponseEvent;
