"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SignInModalContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const SignInModalContext = createContext<SignInModalContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function SignInModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return (
    <SignInModalContext.Provider value={{ isOpen, open, close }}>
      {children}
    </SignInModalContext.Provider>
  );
}

export function useSignInModal() {
  return useContext(SignInModalContext);
}
