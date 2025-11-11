import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsers } from "@/lib/api/user";

export default function UserList() {
  const { data: users, isLoading, isError, error, refetch } = useUsers();

  if (isLoading) return <p>Loading users...</p>;
  if (isError)
    return <p className="text-red-500">Error: {(error as Error).message}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">User List</h1>
        <button
          onClick={() => refetch()}
          className="text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-500"
        >
          Refresh
        </button>
      </div>
      {users?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <Card key={u.id} className="shadow-md">
              <CardHeader>
                <CardTitle>{u.username}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {u.email}
                </p>
                <p className="text-xs text-gray-500">
                  Joined: {new Date(u.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs mt-2 text-gray-500">
                  Projects: {u.projects?.length ?? 0} | Comments:{" "}
                  {u.comments?.length ?? 0}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
}
