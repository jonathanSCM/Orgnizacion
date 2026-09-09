"use client";

import { SessionProvider } from "next-auth/react";
import CommandPalette from "@/components/CommandPalette";
import ConfirmDialogProvider from "@/components/ConfirmDialog";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConfirmDialogProvider>
        {children}
        <CommandPalette />
      </ConfirmDialogProvider>
    </SessionProvider>
  );
}
