"use client";

import React, { useState } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/hooks/useAuth";
import { loginUser, signupUser } from "@/lib/api/auth";
import { useNavigate } from "react-router-dom";

export default function AuthForm() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // only for signup
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"login" | "signup">("login");
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(loginUser({ email, password }));
    navigate("/");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(signupUser({ email, username, password }));
    navigate("/");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/20">
      <Card className="w-[380px] shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            Welcome to Jira Clone
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs
            value={tab}
            onValueChange={(val) => setTab(val as "login" | "signup")}
          >
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={auth.status === "loading"}
                >
                  {auth.status === "loading" ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={auth.status === "loading"}
                >
                  {auth.status === "loading"
                    ? "Creating account..."
                    : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter>
          {auth.error && (
            <p className="text-red-500 text-sm text-center w-full">
              {auth.error}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
