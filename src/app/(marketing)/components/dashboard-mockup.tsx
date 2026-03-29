import {
  CalendarDays,
  Users,
  MessageCircle,
  Settings,
  BarChart3,
  CreditCard,
  Dumbbell,
  Globe,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Scissors,
  User,
} from "lucide-react";

const sidebarItems = [
  { icon: CalendarDays, label: "יומן", active: true },
  { icon: Users, label: "לקוחות", active: false },
  { icon: Scissors, label: "שירותים", active: false },
  { icon: CreditCard, label: "תשלומים", active: false },
  { icon: Dumbbell, label: "שיעורים", active: false },
  { icon: MessageCircle, label: "הודעות", active: false },
  { icon: Globe, label: "האתר שלי", active: false },
  { icon: BarChart3, label: "סטטיסטיקות", active: false },
  { icon: Settings, label: "הגדרות", active: false },
];

const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];

const bookings = [
  { day: 0, startSlot: 0, slots: 2, name: "דנה כהן", service: "תספורת + צבע", color: "bg-blue-100 border-blue-300 text-blue-800" },
  { day: 0, startSlot: 3, slots: 1, name: "רון לוי", service: "תספורת גברים", color: "bg-emerald-100 border-emerald-300 text-emerald-800" },
  { day: 1, startSlot: 1, slots: 2, name: "מיכל אברהם", service: "החלקה", color: "bg-violet-100 border-violet-300 text-violet-800" },
  { day: 1, startSlot: 5, slots: 1, name: "יוסי דוד", service: "עיצוב זקן", color: "bg-amber-100 border-amber-300 text-amber-800" },
  { day: 2, startSlot: 0, slots: 1, name: "שרה גולד", service: "פן", color: "bg-rose-100 border-rose-300 text-rose-800" },
  { day: 2, startSlot: 2, slots: 3, name: "נועה שמש", service: "החלקה + טיפול", color: "bg-blue-100 border-blue-300 text-blue-800" },
  { day: 3, startSlot: 1, slots: 1, name: "אורי כץ", service: "תספורת", color: "bg-emerald-100 border-emerald-300 text-emerald-800" },
  { day: 3, startSlot: 3, slots: 2, name: "הילה ברק", service: "צבע + תספורת", color: "bg-violet-100 border-violet-300 text-violet-800" },
  { day: 4, startSlot: 0, slots: 2, name: "תמר רז", service: "החלקה ברזילאית", color: "bg-amber-100 border-amber-300 text-amber-800" },
  { day: 4, startSlot: 4, slots: 1, name: "עידו פרץ", service: "תספורת", color: "bg-rose-100 border-rose-300 text-rose-800" },
];

export function DashboardMockup() {
  return (
    <div className="relative rounded-xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden select-none" dir="rtl">
      <div className="flex h-[420px] sm:h-[480px]">
        {/* Sidebar */}
        <div className="hidden sm:flex w-48 shrink-0 flex-col border-s border-slate-200 bg-slate-50">
          {/* Sidebar header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
            <div className="flex size-7 items-center justify-center rounded-lg bg-slate-900">
              <CalendarDays className="size-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">BookIT</span>
          </div>

          {/* Nav items */}
          <div className="flex-1 px-2 py-2 space-y-0.5">
            {sidebarItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs ${
                  item.active
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600"
                }`}
              >
                <item.icon className={`size-3.5 ${item.active ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* User */}
          <div className="border-t border-slate-200 px-3 py-2.5 flex items-center gap-2">
            <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="size-3 text-slate-500" />
            </div>
            <div className="text-[10px]">
              <p className="font-medium text-slate-700">סטודיו יופי</p>
              <p className="text-slate-400">beauty@example.com</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <div className="flex items-center justify-between border-b border-slate-200 px-3 sm:px-4 py-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">יומן</h2>
              <div className="flex items-center gap-0.5 mr-2">
                <button className="rounded p-0.5 hover:bg-slate-100">
                  <ChevronRight className="size-3.5 text-slate-400" />
                </button>
                <span className="text-xs font-medium text-slate-600 px-1.5">מרץ 2026</span>
                <button className="rounded p-0.5 hover:bg-slate-100">
                  <ChevronLeft className="size-3.5 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-400">
                <Search className="size-3" />
                <span>חיפוש...</span>
              </div>
              <div className="relative">
                <Bell className="size-4 text-slate-400" />
                <span className="absolute -top-1 -start-1 flex size-3 items-center justify-center rounded-full bg-blue-600 text-[7px] font-bold text-white">3</span>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-3 sm:gap-4 border-b border-slate-100 px-3 sm:px-4 py-2 bg-slate-50/50">
            {[
              { label: "תורים היום", value: "8", color: "text-blue-600" },
              { label: "לקוחות חדשים", value: "3", color: "text-emerald-600" },
              { label: "הודעות", value: "12", color: "text-violet-600" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`text-sm sm:text-base font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex-1 overflow-hidden">
            {/* Day headers */}
            <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: "40px repeat(5, 1fr)" }}>
              <div />
              {days.map((day) => (
                <div key={day} className="border-s border-slate-100 px-1.5 py-1.5 text-center">
                  <span className="text-[10px] font-medium text-slate-500">{day}</span>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="relative">
              <div className="grid" style={{ gridTemplateColumns: "40px repeat(5, 1fr)" }}>
                {hours.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="flex items-start justify-center border-b border-slate-50 py-1">
                      <span className="text-[9px] text-slate-300 font-mono" dir="ltr">{hour}</span>
                    </div>
                    {days.map((day, di) => (
                      <div key={`${hour}-${di}`} className="border-s border-b border-slate-50 h-10 sm:h-12" />
                    ))}
                  </div>
                ))}
              </div>

              {/* Booking cards overlay */}
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "40px repeat(5, 1fr)" }}>
                <div />
                {days.map((_, dayIdx) => (
                  <div key={dayIdx} className="relative border-s border-transparent">
                    {bookings
                      .filter((b) => b.day === dayIdx)
                      .map((booking, i) => {
                        const slotH = "clamp(40px, 100%, 48px)";
                        return (
                          <div
                            key={i}
                            className={`absolute inset-x-0.5 sm:inset-x-1 rounded-[4px] sm:rounded-md border px-1 sm:px-1.5 py-0.5 sm:py-1 overflow-hidden ${booking.color}`}
                            style={{
                              top: `calc(${booking.startSlot} * (100% / 8))`,
                              height: `calc(${booking.slots} * (100% / 8))`,
                            }}
                          >
                            <p className="text-[8px] sm:text-[10px] font-semibold truncate leading-tight">{booking.name}</p>
                            <p className="text-[7px] sm:text-[9px] opacity-70 truncate leading-tight">{booking.service}</p>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shine overlay for premium feel */}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-slate-900/5" />
    </div>
  );
}

export function SiteMockup() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden select-none" dir="rtl">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 border-b border-slate-200">
        <div className="flex gap-1">
          <div className="size-2 rounded-full bg-red-400" />
          <div className="size-2 rounded-full bg-amber-400" />
          <div className="size-2 rounded-full bg-emerald-400" />
        </div>
        <div className="mx-auto rounded bg-white border border-slate-200 px-8 py-0.5 text-[9px] text-slate-400" dir="ltr">
          bookit.co.il/b/studio-beauty
        </div>
      </div>
      {/* Site content */}
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <Scissors className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">סטודיו יופי</p>
            <p className="text-[10px] text-slate-400">תספורות | צבע | טיפולי שיער</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["תספורת נשים", "תספורת גברים", "החלקה ברזילאית", "צבע + תספורת"].map((s) => (
            <div key={s} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
              <p className="text-[10px] sm:text-xs font-medium text-slate-700">{s}</p>
              <div className="mt-1.5 rounded bg-blue-600 px-2 py-0.5 text-[8px] sm:text-[9px] font-semibold text-white">
                קבעו תור
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CrmMockup() {
  const customers = [
    { name: "דנה כהן", status: "פעילה", visits: 12, tag: "VIP", tagColor: "bg-amber-100 text-amber-700" },
    { name: "רון לוי", status: "פעיל", visits: 5, tag: "חדש", tagColor: "bg-blue-100 text-blue-700" },
    { name: "מיכל אברהם", status: "פעילה", visits: 8, tag: "", tagColor: "" },
    { name: "יוסי דוד", status: "ממתין לתשלום", visits: 3, tag: "חוב", tagColor: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden select-none" dir="rtl">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-900">לקוחות</span>
        <span className="text-[10px] text-slate-400">46 לקוחות</span>
      </div>
      <div className="divide-y divide-slate-100">
        {customers.map((c) => (
          <div key={c.name} className="flex items-center gap-3 px-4 py-2.5">
            <div className="size-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <User className="size-3 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-medium text-slate-800 truncate">{c.name}</p>
                {c.tag && (
                  <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${c.tagColor}`}>
                    {c.tag}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-slate-400">{c.visits} ביקורים · {c.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WhatsAppMockup() {
  const messages = [
    { type: "out", text: "שלום דנה! התור שלך אושר ✅\nתספורת + צבע\nיום ראשון, 28.3 בשעה 10:00", time: "10:32" },
    { type: "in", text: "תודה רבה! 🙏", time: "10:33" },
    { type: "out", text: "תזכורת: יש לך תור מחר ⏰\nסטודיו יופי | יום ראשון 10:00", time: "18:00" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden select-none" dir="rtl">
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-700 text-white">
        <MessageCircle className="size-3.5" />
        <span className="text-[11px] font-semibold">WhatsApp · סטודיו יופי</span>
      </div>
      <div className="bg-[#e5ddd5] px-3 py-3 space-y-2 min-h-[180px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.type === "out" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-2.5 py-1.5 ${
                msg.type === "out" ? "bg-[#dcf8c6]" : "bg-white"
              }`}
            >
              <p className="text-[10px] sm:text-[11px] text-slate-800 whitespace-pre-line leading-relaxed">{msg.text}</p>
              <p className="text-[8px] text-slate-400 text-end mt-0.5">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpsMockup() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden select-none" dir="rtl">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-900">סיכום יומי</span>
        <span className="text-[10px] text-slate-400">יום ראשון, 28 מרץ</span>
      </div>
      <div className="p-3 sm:p-4 space-y-3">
        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "תורים", value: "8", icon: CalendarDays, color: "text-blue-600 bg-blue-50" },
            { label: "הכנסות", value: "₪2,340", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
            { label: "שיעורים", value: "2", icon: Dumbbell, color: "text-violet-600 bg-violet-50" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-slate-100 p-2 text-center">
              <div className={`mx-auto mb-1 flex size-6 items-center justify-center rounded-md ${s.color}`}>
                <s.icon className="size-3" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">{s.value}</p>
              <p className="text-[8px] sm:text-[9px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Staff schedule */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-600">צוות פעיל</p>
          {["שירה — 08:00-16:00", "דני — 10:00-18:00"].map((staff) => (
            <div key={staff} className="flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1.5">
              <div className="size-5 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="size-2.5 text-slate-500" />
              </div>
              <span className="text-[10px] text-slate-600">{staff}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
