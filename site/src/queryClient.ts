import { QueryClient } from "@tanstack/react-query";
import { store } from "./store";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// clear cache when user logs out
let lastAuth = store.getState().auth.isAuthenticated;
store.subscribe(() => {
  const current = store.getState().auth.isAuthenticated;
  if (current !== lastAuth) {
    queryClient.clear();
    lastAuth = current;
  }
});
