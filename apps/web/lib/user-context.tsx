"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { meApiV1AuthMeGet } from "@repo/api-client";
import { getTokenCookie } from "./auth-client";

export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user" | string;
  tier: "free" | "pro" | string;
  created_at: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isPro: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = getTokenCookie();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await meApiV1AuthMeGet();
      if (response.data) {
        setUser(response.data as User);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const isAdmin = user?.role === "admin";
  const isPro = user?.tier === "pro";

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        refreshUser: fetchUser,
        isAdmin,
        isPro,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
