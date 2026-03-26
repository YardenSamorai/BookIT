"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  Package,
  UserCircle,
  LayoutDashboard,
  CalendarPlus,
  AlertCircle,
  Loader2,
  Info,
  LogOut,
} from "lucide-react";
import { BookingAuth } from "./booking-auth";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cancelAppointment } from "@/actions/booking";
import {
  updateCustomerSelfProfile,
  completeCustomerOnboarding,
} from "@/actions/customers";
import type { CustomerPackageRow } from "@/lib/db/queries/customers";
import type { CustomerCardRow } from "@/lib/db/queries/cards";
import { BUSINESS_TZ } from "@/lib/tz";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  paymentStatus: string;
  notes: string | null;
  serviceName: string;
  serviceDuration: number;
  staffName: string;
  businessName: string;
  businessSlug: string;
}

interface UserProfile {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

interface CustomerPortalProps {
  isAuthenticated: boolean;
  user: UserProfile | null;
  appointments: Appointment[];
  packages: CustomerPackageRow[];
  cards: CustomerCardRow[];
  slug: string;
  businessName: string;
  secondaryColor: string;
  primaryColor: string;
}

type PortalTab = "overview" | "appointments" | "packages" | "profile";

const TAB_KEYS: PortalTab[] = ["overview", "appointments", "packages", "profile"];
const TAB_ICONS: Record<PortalTab, React.ElementType> = {
  overview: LayoutDashboard,
  appointments: CalendarCheck,
  packages: Package,
  profile: UserCircle,
};
const TAB_I18N: Record<PortalTab, string> = {
  overview: "portal.tab_overview",
  appointments: "portal.tab_appointments",
  packages: "portal.tab_packages",
  profile: "portal.tab_profile",
};

const STATUS_I18N: Record<string, string> = {
  CONFIRMED: "portal.status_confirmed",
  PENDING: "portal.status_pending",
  CANCELLED: "portal.status_cancelled",
  COMPLETED: "portal.status_completed",
  NO_SHOW: "portal.status_no_show",
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-red-100 text-red-700",
};

// ─── Main Portal ──────────────────────────────────────────────────────────────

export function CustomerPortal({
  isAuthenticated,
  user,
  appointments,
  packages,
  cards,
  slug,
  businessName,
  secondaryColor,
  primaryColor,
}: CustomerPortalProps) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as PortalTab) || "overview";
  const [activeTab, setActiveTab] = useState<PortalTab>(
    TAB_KEYS.includes(initialTab) ? initialTab : "overview"
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab") as PortalTab;
    if (tabParam && TAB_KEYS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const needsOnboarding =
    isAuthenticated && user && (!user.name || user.name.trim().length < 2);

  if (!isAuthenticated) {
    return (
      <AuthGate secondaryColor={secondaryColor} onDone={() => router.refresh()} />
    );
  }

  if (needsOnboarding) {
    return (
      <OnboardingGate
        secondaryColor={secondaryColor}
        onDone={() => router.refresh()}
      />
    );
  }

  const displayName =
    user?.firstName || user?.name?.split(" ")[0] || t("portal.tab_profile");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          {t("portal.welcome", { name: displayName })}
        </h2>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `/b/${slug}/my-appointments` })}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <LogOut className="size-3.5" />
          {t("dash.logout" as Parameters<typeof t>[0])}
        </button>
      </div>

      {/* Tab bar - scrollable on mobile */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 min-w-max sm:min-w-0">
          {TAB_KEYS.map((key) => {
            const Icon = TAB_ICONS[key];
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
                  active
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="size-3.5 sm:size-4" />
                {t(TAB_I18N[key] as Parameters<typeof t>[0])}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "overview" && (
            <OverviewTab
              user={user!}
              appointments={appointments}
              packages={packages}
              cards={cards}
              slug={slug}
              secondaryColor={secondaryColor}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === "appointments" && (
            <AppointmentsTab
              appointments={appointments}
              slug={slug}
              secondaryColor={secondaryColor}
            />
          )}
          {activeTab === "packages" && (
            <PackagesTab
              packages={packages}
              cards={cards}
              secondaryColor={secondaryColor}
            />
          )}
          {activeTab === "profile" && (
            <ProfileTab user={user!} secondaryColor={secondaryColor} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Auth Gate ─────────────────────────────────────────────────────────────────

function AuthGate({
  secondaryColor,
  onDone,
}: {
  secondaryColor: string;
  onDone: () => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-col items-center py-8">
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-gray-100">
        <UserCircle className="size-7 text-gray-400" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">
        {t("portal.login_title")}
      </h2>
      <p className="mt-1 mb-6 text-center text-sm text-gray-500">
        {t("portal.login_desc")}
      </p>
      <div className="w-full max-w-sm">
        <BookingAuth secondaryColor={secondaryColor} onAuthenticated={onDone} />
      </div>
    </div>
  );
}

// ─── Onboarding Gate ──────────────────────────────────────────────────────────

function OnboardingGate({
  secondaryColor,
  onDone,
}: {
  secondaryColor: string;
  onDone: () => void;
}) {
  const t = useT();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      const result = await completeCustomerOnboarding({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-gray-100">
        <UserCircle className="size-7 text-gray-400" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">
        {t("portal.onboarding_title")}
      </h2>
      <p className="mt-1 mb-6 text-center text-sm text-gray-500">
        {t("portal.onboarding_desc")}
      </p>
      <div className="w-full max-w-sm space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t("portal.first_name")}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none"
            autoFocus
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t("portal.last_name")}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none"
            onKeyDown={(e) =>
              e.key === "Enter" &&
              firstName.trim().length >= 2 &&
              lastName.trim().length >= 1 &&
              handleSubmit()
            }
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || firstName.trim().length < 2 || lastName.trim().length < 1}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}dd)`,
            boxShadow: `0 2px 12px ${secondaryColor}30`,
          }}
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {t("portal.continue")}
        </button>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  user,
  appointments,
  packages,
  cards,
  slug,
  secondaryColor,
  onNavigate,
}: {
  user: UserProfile;
  appointments: Appointment[];
  packages: CustomerPackageRow[];
  cards: CustomerCardRow[];
  slug: string;
  secondaryColor: string;
  onNavigate: (tab: PortalTab) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => new Date(a.startTime) > new Date() && a.status !== "CANCELLED")
        .slice(0, 2),
    [appointments]
  );

  const pendingPayment = useMemo(
    () =>
      [
        ...packages.filter((p) => p.paymentStatus !== "PAID"),
        ...cards.filter((c) => c.paymentStatus !== "PAID"),
      ].length,
    [packages, cards]
  );

  const profileIncomplete = !user.email;

  return (
    <div className="space-y-4">
      {/* Pending payment alert */}
      {pendingPayment > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertCircle className="size-5 shrink-0 text-amber-500" />
          <p className="text-sm font-medium text-amber-800">
            {t("portal.pending_alert")}
          </p>
        </div>
      )}

      {/* Profile nudge */}
      {profileIncomplete && (
        <button
          type="button"
          onClick={() => onNavigate("profile")}
          className="flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-start transition-colors hover:bg-blue-100"
        >
          <Info className="size-5 shrink-0 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              {t("portal.complete_profile")}
            </p>
            <p className="text-xs text-blue-600">{t("portal.add_email_hint")}</p>
          </div>
        </button>
      )}

      {/* Next Appointment */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {t("portal.next_appointment")}
        </h3>
        {upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center gap-3 rounded-xl border bg-white p-3"
              >
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${secondaryColor}12` }}
                >
                  <CalendarCheck className="size-5" style={{ color: secondaryColor }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {apt.serviceName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(apt.startTime).toLocaleDateString(dateLocale, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      timeZone: BUSINESS_TZ,
                    })}{" "}
                    ·{" "}
                    {new Date(apt.startTime).toLocaleTimeString(dateLocale, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: dateLocale === "en-US",
                      timeZone: BUSINESS_TZ,
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {apt.staffName}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border bg-white p-4 text-center text-sm text-gray-400">
            {t("portal.no_upcoming")}
          </p>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {t("portal.quick_actions")}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <a
            href={`/b/${slug}#services`}
            className="flex flex-col items-center gap-1.5 rounded-xl border bg-white p-3 text-center transition-colors hover:bg-gray-50"
          >
            <CalendarPlus className="size-5" style={{ color: secondaryColor }} />
            <span className="text-[11px] font-medium text-gray-700 leading-tight">
              {t("portal.book_now")}
            </span>
          </a>
          <button
            type="button"
            onClick={() => onNavigate("packages")}
            className="flex flex-col items-center gap-1.5 rounded-xl border bg-white p-3 text-center transition-colors hover:bg-gray-50"
          >
            <Package className="size-5" style={{ color: secondaryColor }} />
            <span className="text-[11px] font-medium text-gray-700 leading-tight">
              {t("portal.view_packages")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("profile")}
            className="flex flex-col items-center gap-1.5 rounded-xl border bg-white p-3 text-center transition-colors hover:bg-gray-50"
          >
            <UserCircle className="size-5" style={{ color: secondaryColor }} />
            <span className="text-[11px] font-medium text-gray-700 leading-tight">
              {t("portal.update_profile")}
            </span>
          </button>
        </div>
      </section>

      {/* Recent Appointments preview */}
      {appointments.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {t("portal.recent_appointments")}
            </h3>
            <button
              type="button"
              onClick={() => onNavigate("appointments")}
              className="text-xs font-medium hover:underline"
              style={{ color: secondaryColor }}
            >
              {t("common.view_all")}
            </button>
          </div>
          <div className="space-y-2">
            {appointments.slice(0, 3).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {apt.serviceName}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {new Date(apt.startTime).toLocaleDateString(dateLocale, {
                      month: "short",
                      day: "numeric",
                      timeZone: BUSINESS_TZ,
                    })}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[apt.status] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {t(STATUS_I18N[apt.status] as Parameters<typeof t>[0]) ?? apt.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Appointments Tab ─────────────────────────────────────────────────────────

function AppointmentsTab({
  appointments,
  slug,
  secondaryColor,
}: {
  appointments: Appointment[];
  slug: string;
  secondaryColor: string;
}) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  const router = useRouter();

  const upcoming = appointments.filter(
    (a) => new Date(a.startTime) > new Date() && a.status !== "CANCELLED"
  );
  const past = appointments.filter(
    (a) => new Date(a.startTime) <= new Date() || a.status === "CANCELLED"
  );

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <CalendarCheck className="size-10 text-gray-300" />
        <p className="mt-3 font-medium text-gray-500">{t("myapt.no_appointments")}</p>
        <a
          href={`/b/${slug}#services`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: secondaryColor }}
        >
          <CalendarPlus className="size-4" />
          {t("portal.book_now")}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cancellation policy */}
      <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
        <Info className="mt-0.5 size-4 shrink-0 text-gray-400" />
        <p className="text-xs text-gray-500">{t("portal.cancel_policy")}</p>
      </div>

      {upcoming.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            {t("myapt.upcoming")}
          </h3>
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <PortalAppointmentCard
                key={apt.id}
                appointment={apt}
                secondaryColor={secondaryColor}
                dateLocale={dateLocale}
                canCancel
                onRefresh={() => router.refresh()}
              />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            {t("myapt.past")}
          </h3>
          <div className="space-y-3">
            {past.map((apt) => (
              <PortalAppointmentCard
                key={apt.id}
                appointment={apt}
                secondaryColor={secondaryColor}
                dateLocale={dateLocale}
                onRefresh={() => router.refresh()}
              />
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-center">
        <a
          href={`/b/${slug}#services`}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: secondaryColor }}
        >
          <CalendarPlus className="size-4" />
          {t("portal.book_now")}
        </a>
      </div>
    </div>
  );
}

function PortalAppointmentCard({
  appointment: apt,
  secondaryColor,
  dateLocale,
  canCancel,
  onRefresh,
}: {
  appointment: Appointment;
  secondaryColor: string;
  dateLocale: string;
  canCancel?: boolean;
  onRefresh: () => void;
}) {
  const t = useT();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const startDate = new Date(apt.startTime);
  const dateDisplay = startDate.toLocaleDateString(dateLocale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: BUSINESS_TZ,
  });
  const timeDisplay = startDate.toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: dateLocale === "en-US",
    timeZone: BUSINESS_TZ,
  });

  async function handleCancel() {
    setCancelling(true);
    await cancelAppointment(apt.id, "CUSTOMER");
    setCancelOpen(false);
    setCancelling(false);
    onRefresh();
  }

  return (
    <>
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{apt.serviceName}</p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[apt.status] ?? "bg-gray-100 text-gray-600"}`}
              >
                {t(STATUS_I18N[apt.status] as Parameters<typeof t>[0]) ?? apt.status}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              <p>{apt.staffName}</p>
              <p>
                {dateDisplay} · {timeDisplay} · {apt.serviceDuration} {t("common.min")}
              </p>
            </div>
          </div>

          {canCancel && apt.status !== "CANCELLED" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setCancelOpen(true)}
            >
              {t("common.cancel")}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("myapt.cancel_title")}</DialogTitle>
            <DialogDescription>
              {t("myapt.cancel_confirm", {
                service: apt.serviceName,
                date: dateDisplay,
                time: timeDisplay,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>
              {t("myapt.keep")}
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("myapt.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Packages Tab ─────────────────────────────────────────────────────────────

function PackagesTab({
  packages,
  cards,
  secondaryColor,
}: {
  packages: CustomerPackageRow[];
  cards: CustomerCardRow[];
  secondaryColor: string;
}) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const allItems = useMemo(() => {
    type PkgItem = {
      id: string;
      name: string;
      kind: "package" | "card";
      sessionsUsed: number;
      sessionsTotal: number;
      sessionsRemaining: number;
      paymentStatus: string;
      status: string;
      expiresAt: Date | null;
    };

    const pkgs: PkgItem[] = packages.map((p) => ({
      id: p.id,
      name: p.packageName,
      kind: "package",
      sessionsUsed: p.sessionsUsed,
      sessionsTotal: p.sessionsUsed + p.sessionsRemaining,
      sessionsRemaining: p.sessionsRemaining,
      paymentStatus: p.paymentStatus,
      status: p.status,
      expiresAt: p.expiresAt ? new Date(p.expiresAt) : null,
    }));

    const cds: PkgItem[] = cards.map((c) => ({
      id: c.id,
      name: c.templateSnapshotName,
      kind: "card",
      sessionsUsed: c.sessionsUsed,
      sessionsTotal: c.sessionsTotal,
      sessionsRemaining: c.sessionsRemaining,
      paymentStatus: c.paymentStatus,
      status: c.status,
      expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
    }));

    return [...pkgs, ...cds];
  }, [packages, cards]);

  const active = allItems.filter((i) => i.status === "ACTIVE" && i.paymentStatus === "PAID");
  const pendingPayment = allItems.filter((i) => i.paymentStatus !== "PAID");
  const history = allItems.filter(
    (i) => i.status !== "ACTIVE" && i.paymentStatus === "PAID"
  );

  const hasAny = allItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Active Packages */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {t("portal.active_packages")}
        </h3>
        {active.length > 0 ? (
          <div className="space-y-2">
            {active.map((item) => (
              <PackageCard
                key={item.id}
                item={item}
                secondaryColor={secondaryColor}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border bg-white p-4 text-center text-sm text-gray-400">
            {t("portal.no_active_packages")}
          </p>
        )}
      </section>

      {/* Payment Pending */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {t("portal.pending_payment")}
        </h3>
        {pendingPayment.length > 0 ? (
          <div className="space-y-2">
            {pendingPayment.map((item) => (
              <PackageCard
                key={item.id}
                item={item}
                secondaryColor={secondaryColor}
                dateLocale={dateLocale}
                showPaymentBadge
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border bg-white p-4 text-center text-sm text-gray-400">
            {t("portal.no_pending_packages")}
          </p>
        )}
      </section>

      {/* History */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {t("portal.package_history")}
        </h3>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border bg-white/60 p-3 opacity-60"
              >
                <p className="text-sm font-medium text-gray-700 truncate">
                  {item.name}
                </p>
                <Badge variant="secondary" className="text-[10px]">
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border bg-white p-4 text-center text-sm text-gray-400">
            {t("portal.no_package_history")}
          </p>
        )}
      </section>
    </div>
  );
}

function PackageCard({
  item,
  secondaryColor,
  dateLocale,
  showPaymentBadge,
}: {
  item: {
    id: string;
    name: string;
    sessionsUsed: number;
    sessionsTotal: number;
    sessionsRemaining: number;
    paymentStatus: string;
    expiresAt: Date | null;
  };
  secondaryColor: string;
  dateLocale: string;
  showPaymentBadge?: boolean;
}) {
  const t = useT();
  const pct = item.sessionsTotal > 0 ? (item.sessionsUsed / item.sessionsTotal) * 100 : 0;

  return (
    <div className="overflow-hidden rounded-xl border bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold truncate">{item.name}</p>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-white"
          style={{ backgroundColor: secondaryColor }}
        >
          {item.sessionsRemaining}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: secondaryColor, opacity: 0.7 }}
          />
        </div>
        <span className="text-[10px] tabular-nums text-gray-400">
          {item.sessionsUsed}/{item.sessionsTotal}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-gray-400">
        {showPaymentBadge ? (
          <span className="font-medium text-amber-600">
            {t("portal.pending_payment")}
          </span>
        ) : (
          <span className="font-medium text-green-600">
            {t("portal.sessions_left", { n: String(item.sessionsRemaining) })}
          </span>
        )}
        {item.expiresAt && (
          <span>
            {new Date(item.expiresAt).toLocaleDateString(dateLocale, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({
  user,
  secondaryColor,
}: {
  user: UserProfile;
  secondaryColor: string;
}) {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const nameParts = user.name?.split(" ") ?? [];
  const [firstName, setFirstName] = useState(user.firstName || nameParts[0] || "");
  const [lastName, setLastName] = useState(
    user.lastName || nameParts.slice(1).join(" ") || ""
  );
  const [email, setEmail] = useState(user.email || "");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateCustomerSelfProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || null,
      });
      if (result.success) {
        setMessage({ type: "success", text: t("portal.profile_updated") });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 space-y-4">
        {/* First + Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              {t("portal.first_name")}
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-all focus:border-gray-300 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              {t("portal.last_name")}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-all focus:border-gray-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            {t("portal.profile_email")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-all focus:border-gray-300 focus:outline-none"
          />
        </div>

        {/* Phone (read-only) */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            {t("portal.profile_phone")}
          </label>
          <input
            type="tel"
            value={user.phone || ""}
            readOnly
            dir="ltr"
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
          />
          <p className="mt-1 text-[11px] text-gray-400">
            {t("portal.phone_readonly_hint")}
          </p>
        </div>

        {/* Feedback */}
        {message && (
          <p
            className={`text-sm font-medium ${
              message.type === "success" ? "text-green-600" : "text-red-500"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || firstName.trim().length < 2 || lastName.trim().length < 1}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}dd)`,
            boxShadow: `0 2px 12px ${secondaryColor}30`,
          }}
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {t("portal.save_profile")}
        </button>
      </div>
    </div>
  );
}
