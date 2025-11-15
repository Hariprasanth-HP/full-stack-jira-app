import { useAppSelector } from "@/hooks/useAuth";
import { useProjects } from "@/lib/api/projects";
import { useQuery } from "@tanstack/react-query";
import React from "react";

export function Pagination() {
  const [page, setPage] = React.useState(0);
  const auth = useAppSelector((state) => state.auth);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    isPreviousData,
  } = useProjects(auth?.user);

  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : isError ? (
        <div>Error: {error.message}</div>
      ) : (
        <div>
          {data.map((project) => (
            <p key={project.id}>{project.name}</p>
          ))}
        </div>
      )}
      <span>Current Page: {page + 1}</span>
      <button
        onClick={() => setPage((old) => Math.max(old - 1, 0))}
        disabled={page === 0}
      >
        Previous Page
      </button>{" "}
      <button
        onClick={() => {
          if (!isPreviousData && data.hasMore) {
            setPage((old) => old + 1);
          }
        }}
        // Disable the Next Page button until we know a next page is available
        disabled={isPreviousData || !data?.hasMore}
      >
        Next Page
      </button>
      {isFetching ? <span> Loading...</span> : null}{" "}
    </div>
  );
}
