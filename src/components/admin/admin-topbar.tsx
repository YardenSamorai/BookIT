"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AdminTopbar({ userName }: { userName: string }) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger />
      <div className="flex-1" />
      <span className="text-sm text-muted-foreground">{userName}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="me-2 size-4" />
        התנתקות
      </Button>
    </header>
  );
}
