// hooks/useactivity.ts
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/apiClient'; // implement if not present

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export async function generateResultsAPI(payload: { prompt?: string }) {
  return apiPost<GenerateRes>(`/generate`, payload);
}

type GenerateRes = { success: boolean; data: { text: string } };

// Create activity
export function useGenerateResults() {
  return useMutation<GenerateRes, Error, { prompt: string }>({
    mutationFn: (payload) => generateResultsAPI(payload),
  });
}
