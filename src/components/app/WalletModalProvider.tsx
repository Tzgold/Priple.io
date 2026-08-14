"use client";

import { createContext, useContext, useState } from "react";
import { AddWalletModal } from "@/components/app/AddWalletModal";

const ModalContext = createContext<{ openAddWallet: () => void } | null>(null);

export function useAddWallet() {
  const value = useContext(ModalContext);
  if (!value) throw new Error("useAddWallet must be used inside WalletModalProvider");
  return value;
}

export function WalletModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <ModalContext.Provider value={{ openAddWallet: () => setOpen(true) }}>
      {children}
      <AddWalletModal open={open} onClose={() => setOpen(false)} />
    </ModalContext.Provider>
  );
}
