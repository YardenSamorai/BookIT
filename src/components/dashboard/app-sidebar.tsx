"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Scissors,
  UserCog,
  ShoppingBag,
  CreditCard,
  Settings,
  PaintBucket,
  Star,
  ExternalLink,
  BarChart3,
  Repeat,
  MessageSquare,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { getDir } from "@/lib/i18n";
import type { LucideIcon } from "lucide-react";

type NavItem = { title: string; href: string; icon: LucideIcon };

function NavGroup({
  label,
  items,
  currentPath,
}: {
  label: string;
  items: NavItem[];
  currentPath: string;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  function handleClick() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? currentPath === "/dashboard"
                : currentPath.startsWith(item.href);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} onClick={handleClick} />}
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
  );
}

export function AppSidebar({ businessSlug }: { businessSlug?: string }) {
  const pathname = usePathname();
  const currentPath = pathname || "/dashboard";
  const t = useT();
  const locale = useLocale();
  const dir = getDir(locale);

  const mainNav: NavItem[] = [
    { title: t("dash.overview"), href: "/dashboard", icon: LayoutDashboard },
    { title: t("dash.calendar"), href: "/dashboard/calendar", icon: CalendarDays },
    { title: t("dash.appointments"), href: "/dashboard/appointments", icon: ClipboardList },
    { title: t("dash.customers"), href: "/dashboard/customers", icon: Users },
    { title: t("dash.reviews"), href: "/dashboard/reviews", icon: Star },
    { title: t("dash.statistics"), href: "/dashboard/statistics", icon: BarChart3 },
  ];

  const manageNav: NavItem[] = [
    { title: t("dash.services"), href: "/dashboard/services", icon: Scissors },
    { title: t("dash.classes"), href: "/dashboard/classes", icon: Repeat },
    { title: t("dash.staff"), href: "/dashboard/staff", icon: UserCog },
    { title: t("dash.products"), href: "/dashboard/products", icon: ShoppingBag },
  ];

  const systemNav: NavItem[] = [
    { title: t("dash.payments"), href: "/dashboard/payments", icon: CreditCard },
    { title: t("dash.messages" as Parameters<typeof t>[0]), href: "/dashboard/messages", icon: MessageSquare },
    { title: t("dash.site_editor"), href: "/dashboard/site-editor", icon: PaintBucket },
    { title: t("dash.settings"), href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <Sidebar side={locale === "he" ? "right" : "left"} dir={dir}>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          BookIT
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label={t("dash.dashboard")} items={mainNav} currentPath={currentPath} />
        <NavGroup label={t("dash.manage")} items={manageNav} currentPath={currentPath} />
        <NavGroup label={t("dash.system")} items={systemNav} currentPath={currentPath} />
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {businessSlug && (
          <Link
            href={`/b/${businessSlug}`}
            target="_blank"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            <ExternalLink className="size-4" />
            {t("dash.view_site")}
          </Link>
        )}
        <p className="px-2 text-xs text-muted-foreground">BookIT v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}
