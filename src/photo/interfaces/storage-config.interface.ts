export interface UploadResult {
  url: string;
  key: string;
}

export interface FileValidationOptions {
  maxSize: number; // in bytes
  allowedMimeTypes: string[];
}
