import { useMutation, useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient"; // the one we built earlier

// Define the shape of your user (should match your Prisma model)
export interface User {
  id: number;
  email: string;
  username: string;
  createdAt: string;
  Teams?: any[];
  activities?: any[];
}

interface GetUsersResponse {
  success: boolean;
  data: User[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export async function getUsersFromTeamApi(teamId: number) {
  return apiGet<{ success: boolean }>(`/user/team?teamId=${teamId}`);
}

export function useUsers(teamId) {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiGet<GetUsersResponse>(`/user?teamId=${teamId}`);
      if (!res.success) throw new Error("Failed to fetch users");
      return res.data;
    },
    staleTime: 0, // cache for 5 mins
    refetchOnMount: true,
  });
}

export function useFetchUsersFromTeam() {
  return useMutation<team, Error, any>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: any) => {
      return getUsersFromTeamApi(payload.teamId);
    },
  });
}
