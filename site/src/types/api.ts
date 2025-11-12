export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
  error?: string;
}
export enum FormMode {
  CREATE = "create",
  EDIT = "edit",
}
