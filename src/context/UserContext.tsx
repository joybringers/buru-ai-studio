"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { FAKE_USER } from "@/data/fake";

interface UserContextValue {
  balance: number;
  monthlySpent: number;
  monthlyCap: number;
  deduct: (credits: number) => void;
  refreshBalance: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(FAKE_USER.balance);
  const [monthlySpent, setMonthlySpent] = useState(FAKE_USER.monthlySpent);

  async function refreshBalance() {
    try {
      const res = await fetch("/api/balance");
      if (res.ok) {
        const { balance: serverBalance } = await res.json();
        setBalance(serverBalance);
      }
    } catch {
      // silently keep last known value on network error
    }
  }

  useEffect(() => {
    refreshBalance();
  }, []);

  function deduct(credits: number) {
    // Optimistic update — real deduction happens server-side in the generate route.
    setBalance((b) => b - credits);
    setMonthlySpent((s) => s + credits);
  }

  return (
    <UserContext.Provider
      value={{ balance, monthlySpent, monthlyCap: FAKE_USER.monthlyCap, deduct, refreshBalance }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
