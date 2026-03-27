"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, CalendarDays, TicketCheck, Globe } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "דשבורד", href: "/admin", icon: LayoutDashboard },
  { title: "עסקים", href: "/admin/businesses", icon: Building2 },
  { title: "טיקטים", href: "/admin/tickets", icon: TicketCheck },
  { title: "סאב-דומיינים", href: "/admin/subdomains", icon: Globe },
];

export function AdminSidebar() {
  const pathname = usePathname() || "/admin";

  return (
    <Sidebar side="right" dir="rtl">
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-900">
            <CalendarDays className="size-4 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">BookIT</span>
            <span className="mr-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
              ADMIN
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <p className="px-2 text-xs text-muted-foreground">BookIT Admin v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}
