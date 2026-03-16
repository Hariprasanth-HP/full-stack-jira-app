// hooks/useactivity.ts
import { useMutation } from '@tanstack/react-query';
import { api } from '../axiosHelper';
// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export type UploadedMedia = {
  url: string;
  publicId: string;
  type: 'image' | 'video';
};

export type UploadMediaRes = {
  success: boolean;
  count: number;
  data: UploadedMedia[];
};
// hooks/useUploadActivity.ts

export function useUploadMedia(id: number) {
  return useMutation({
    mutationFn: ({
      files,
      onProgress,
      signal,
    }: {
      files: File[];
      onProgress?: (percent: number) => void;
      signal?: AbortSignal;
    }) => uploadFilesAPI(files, id, { onProgress, signal }),
  });
}
export async function uploadFilesAPI(
  files: File[],
  id: number,
  options?: {
    onProgress?: (percent: number) => void;
    signal?: AbortSignal;
  }
) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  const res = await api.post(`/upload/multiple?taskId=${id}`, formData, {
    signal: options?.signal,
    onUploadProgress: (event) => {
      if (!event.total) return;
      const percent = Math.round((event.loaded * 100) / event.total);
      options?.onProgress?.(percent);
    },
  });

  return res.data;
}
