"use client";

import { signOut } from "next-auth/react";
import { ExternalLink, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useT } from "@/lib/i18n/locale-context";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Topbar({
  userName,
  businessName,
  businessSlug,
}: {
  userName: string;
  businessName?: string;
  businessSlug?: string;
}) {
  const t = useT();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger />

      <div className="flex-1" />

      {businessSlug && (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/b/${businessSlug}`} target="_blank" />}
          className="hidden md:flex"
        >
          <ExternalLink className="me-2 size-3.5" />
          {t("dash.view_site")}
        </Button>
      )}

      {businessName && (
        <span className="hidden text-sm text-muted-foreground lg:block">
          {businessName}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="relative size-8 rounded-full" />
          }
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{userName}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.location.href = "/dashboard/settings"}>
            <User className="me-2 size-4" />
            {t("dash.settings")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="me-2 size-4" />
            {t("dash.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
