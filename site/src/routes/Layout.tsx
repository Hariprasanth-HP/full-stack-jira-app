// src/components/Layout.tsx
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/hooks/useAuth";
import { logoutUser } from "@/lib/api/auth";
import React from "react";
import { Link, Outlet } from "react-router-dom";

export const Layout: React.FC = () => {
  const auth = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="text-lg font-bold">
            Jira Clone
          </Link>
          <nav className="flex gap-4">
            <Link to="/projects" className="hover:underline">
              Projects
            </Link>
            <Link to="/profile" className="hover:underline">
              Profile
            </Link>
            {auth?.isAuthenticated ? (
              <Button
                className="color"
                onClick={() => {
                  dispatch(logoutUser());
                }}
              >
                Logout
              </Button>
            ) : (
              <Link to="/login" className="hover:underline">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4">
        <Outlet />
      </main>

      <footer className="border-t p-4 text-center text-sm">
        © {new Date().getFullYear()} Your Company
      </footer>
    </div>
  );
};

export default Layout;
