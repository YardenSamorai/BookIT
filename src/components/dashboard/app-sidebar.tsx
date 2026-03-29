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
  Wallet,
  Settings,
  PaintBucket,
  Star,
  ExternalLink,
  BarChart3,
  Repeat,
  MessageSquare,
  LifeBuoy,
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

type NavItem = { title: string; href: string; icon: LucideIcon; module?: string };

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

export function AppSidebar({ businessSlug, enabledModules }: { businessSlug?: string; enabledModules?: string[] | null }) {
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
    { title: t("dash.reviews"), href: "/dashboard/reviews", icon: Star, module: "reviews" },
    { title: t("dash.statistics"), href: "/dashboard/statistics", icon: BarChart3, module: "statistics" },
  ];

  const manageNav: NavItem[] = [
    { title: t("dash.services"), href: "/dashboard/services", icon: Scissors, module: "services" },
    { title: t("dash.cards"), href: "/dashboard/packages", icon: Wallet, module: "packages" },
    { title: t("dash.classes"), href: "/dashboard/classes", icon: Repeat, module: "classes" },
    { title: t("dash.staff"), href: "/dashboard/staff", icon: UserCog, module: "staff" },
    { title: t("dash.products"), href: "/dashboard/products", icon: ShoppingBag, module: "products" },
  ];

  const systemNav: NavItem[] = [
    { title: t("dash.payments"), href: "/dashboard/payments", icon: CreditCard, module: "payments" },
    { title: t("dash.messages" as Parameters<typeof t>[0]), href: "/dashboard/messages", icon: MessageSquare, module: "messages" },
    { title: t("dash.site_editor"), href: "/dashboard/site-editor", icon: PaintBucket },
    { title: t("dash.settings"), href: "/dashboard/settings", icon: Settings },
    { title: t("dash.tickets" as never), href: "/dashboard/tickets", icon: LifeBuoy },
  ];

  const filterByModule = (items: NavItem[]) => {
    if (!enabledModules) return items;
    return items.filter((item) => !item.module || enabledModules.includes(item.module));
  };

  const filteredMain = filterByModule(mainNav);
  const filteredManage = filterByModule(manageNav);
  const filteredSystem = filterByModule(systemNav);

  return (
    <Sidebar side={locale === "he" ? "right" : "left"} dir={dir}>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          BookIT
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label={t("dash.dashboard")} items={filteredMain} currentPath={currentPath} />
        {filteredManage.length > 0 && (
          <NavGroup label={t("dash.manage")} items={filteredManage} currentPath={currentPath} />
        )}
        <NavGroup label={t("dash.system")} items={filteredSystem} currentPath={currentPath} />
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
