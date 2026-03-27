"use client";

import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function HebrewContent() {
  return (
    <>
      <Section title="1. כללי">
        <p>
          BookIT (להלן: &quot;החברה&quot;, &quot;אנחנו&quot;) מחויבת להגנה על פרטיות המשתמשים
          שלה. מדיניות פרטיות זו מתארת כיצד אנו אוספים, משתמשים, מאחסנים ומגנים
          על המידע האישי שלך בעת השימוש בפלטפורמת BookIT.
        </p>
        <p>
          מדיניות זו חלה על בעלי עסקים הנרשמים למערכת ועל לקוחות סופיים הקובעים
          תורים או רוכשים שירותים דרך המערכת.
        </p>
      </Section>

      <Section title="2. מידע שאנו אוספים">
        <p><strong>פרטי רישום:</strong></p>
        <ul className="list-disc space-y-1 ps-5">
          <li>שם מלא</li>
          <li>כתובת אימייל</li>
          <li>מספר טלפון</li>
          <li>סיסמה (מוצפנת)</li>
        </ul>

        <p className="pt-2"><strong>נתוני עסק (בעלי עסקים):</strong></p>
        <ul className="list-disc space-y-1 ps-5">
          <li>שם העסק, כתובת, לוגו ותמונות</li>
          <li>שעות פעילות</li>
          <li>רשימת שירותים ומחירים</li>
          <li>פרטי צוות</li>
        </ul>

        <p className="pt-2"><strong>נתוני שימוש:</strong></p>
        <ul className="list-disc space-y-1 ps-5">
          <li>תורים ופגישות שנקבעו</li>
          <li>הודעות שנשלחו (WhatsApp / SMS)</li>
          <li>פעולות במערכת (לוגים)</li>
          <li>כתובת IP ונתוני דפדפן</li>
        </ul>

        <p className="pt-2"><strong>Cookies:</strong></p>
        <p>
          אנו משתמשים ב-cookies הכרחיים לצורך אימות משתמשים, שמירת העדפות
          ושיפור חוויית השימוש. אנו לא משתמשים ב-cookies לצורכי פרסום.
        </p>
      </Section>

      <Section title="3. כיצד אנו משתמשים במידע">
        <p>המידע שנאסף משמש לצרכים הבאים:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li>הפעלה ותחזוקה של השירות</li>
          <li>שליחת הודעות אישור, תזכורות וביטולים ללקוחות</li>
          <li>שליחת הודעות מערכת לבעלי עסקים (תור חדש, ביטול, וכו&apos;)</li>
          <li>שיפור השירות ופיתוח תכונות חדשות</li>
          <li>מתן תמיכה טכנית</li>
          <li>מניעת הונאות ושימוש לרעה</li>
          <li>עמידה בדרישות חוק</li>
        </ul>
      </Section>

      <Section title="4. שיתוף מידע עם צדדים שלישיים">
        <p>אנו לא מוכרים, משכירים או סוחרים במידע האישי שלך. המידע משותף רק עם:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li><strong>Twilio</strong> — לצורך שליחת הודעות WhatsApp ו-SMS (מספר טלפון ותוכן ההודעה)</li>
          <li><strong>Vercel</strong> — אירוח האפליקציה</li>
          <li><strong>ספק מסד נתונים</strong> — אחסון מאובטח של הנתונים (PostgreSQL)</li>
          <li><strong>Cloudflare</strong> — אחסון קבצים ותמונות</li>
          <li><strong>רשויות חוק</strong> — רק כאשר נדרש על פי צו שיפוטי או חוק</li>
        </ul>
      </Section>

      <Section title="5. אחסון ואבטחת מידע">
        <ul className="list-disc space-y-1 ps-5">
          <li>כל הנתונים מאוחסנים בשרתים מאובטחים עם הצפנה בזמן מעבר (TLS/SSL).</li>
          <li>סיסמאות מאוחסנות בהצפנה חד-כיוונית (hashing) ואינן נגישות לאף אחד, כולל לצוות שלנו.</li>
          <li>הגישה לבסיס הנתונים מוגבלת ומבוקרת.</li>
          <li>אנו מבצעים גיבויים שוטפים למניעת אובדן נתונים.</li>
        </ul>
      </Section>

      <Section title="6. זכויות המשתמש">
        <p>בהתאם לחוק הגנת הפרטיות, התשמ&quot;א-1981, עומדות לך הזכויות הבאות:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li><strong>גישה</strong> — לבקש עותק של המידע האישי שלך.</li>
          <li><strong>תיקון</strong> — לבקש תיקון מידע שגוי או לא מעודכן.</li>
          <li><strong>מחיקה</strong> — לבקש מחיקת המידע שלך (בכפוף למגבלות חוקיות).</li>
          <li><strong>ניוד</strong> — לקבל את המידע שלך בפורמט מובנה.</li>
          <li><strong>התנגדות</strong> — להתנגד לעיבוד מידע מסוים.</li>
        </ul>
        <p>לצורך מימוש זכויות אלה, ניתן לפנות אלינו בפרטי הקשר המופיעים בסוף מסמך זה.</p>
      </Section>

      <Section title="7. שמירת מידע">
        <ul className="list-disc space-y-1 ps-5">
          <li>מידע חשבון נשמר כל עוד החשבון פעיל.</li>
          <li>לאחר ביטול חשבון, המידע נשמר למשך 30 יום ולאחר מכן נמחק לצמיתות.</li>
          <li>לוגים ונתוני שימוש עשויים להישמר למשך עד 12 חודשים לצורכי אבטחה וניתוח.</li>
        </ul>
      </Section>

      <Section title="8. שינויים במדיניות">
        <p>
          אנו רשאים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באתר
          ויישלחו בהודעה למשתמשים. המשך השימוש לאחר העדכון מהווה הסכמה למדיניות
          המעודכנת.
        </p>
      </Section>

      <Section title="9. יצירת קשר">
        <p>לכל שאלה בנוגע למדיניות הפרטיות או למימוש זכויותיך, ניתן לפנות אלינו:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li>WhatsApp: <a href="https://wa.me/972526843000" className="text-blue-600 hover:underline" dir="ltr">+972-52-684-3000</a></li>
          <li>אימייל: <a href="mailto:Yardensamorai6@gmail.com" className="text-blue-600 hover:underline">Yardensamorai6@gmail.com</a></li>
        </ul>
      </Section>
    </>
  );
}

function EnglishContent() {
  return (
    <>
      <Section title="1. General">
        <p>
          BookIT (hereinafter: &quot;the Company&quot;, &quot;we&quot;) is committed to protecting
          the privacy of its users. This privacy policy describes how we collect,
          use, store, and protect your personal information when using the BookIT
          platform.
        </p>
        <p>
          This policy applies to business owners who register for the system and
          to end customers who book appointments or purchase services through the
          system.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p><strong>Registration details:</strong></p>
        <ul className="list-disc space-y-1 ps-5">
          <li>Full name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Password (encrypted)</li>
        </ul>

        <p className="pt-2"><strong>Business data (business owners):</strong></p>
        <ul className="list-disc space-y-1 ps-5">
          <li>Business name, address, logo and images</li>
          <li>Operating hours</li>
          <li>Service list and pricing</li>
          <li>Staff details</li>
        </ul>

        <p className="pt-2"><strong>Usage data:</strong></p>
        <ul className="list-disc space-y-1 ps-5">
          <li>Appointments and bookings</li>
          <li>Messages sent (WhatsApp / SMS)</li>
          <li>System activity (logs)</li>
          <li>IP address and browser data</li>
        </ul>

        <p className="pt-2"><strong>Cookies:</strong></p>
        <p>
          We use essential cookies for authentication, saving preferences, and
          improving the user experience. We do not use advertising cookies.
        </p>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>The collected information is used for:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li>Operating and maintaining the service</li>
          <li>Sending confirmation, reminder, and cancellation messages to customers</li>
          <li>Sending system notifications to business owners</li>
          <li>Improving the service and developing new features</li>
          <li>Providing technical support</li>
          <li>Preventing fraud and abuse</li>
          <li>Compliance with legal requirements</li>
        </ul>
      </Section>

      <Section title="4. Sharing Information with Third Parties">
        <p>We do not sell, rent, or trade your personal information. Information is shared only with:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li><strong>Twilio</strong> — for sending WhatsApp and SMS messages (phone number and message content)</li>
          <li><strong>Vercel</strong> — application hosting</li>
          <li><strong>Database provider</strong> — secure data storage (PostgreSQL)</li>
          <li><strong>Cloudflare</strong> — file and image storage</li>
          <li><strong>Law enforcement</strong> — only when required by court order or law</li>
        </ul>
      </Section>

      <Section title="5. Data Storage and Security">
        <ul className="list-disc space-y-1 ps-5">
          <li>All data is stored on secure servers with encryption in transit (TLS/SSL).</li>
          <li>Passwords are stored using one-way hashing and are not accessible to anyone, including our team.</li>
          <li>Database access is restricted and monitored.</li>
          <li>We perform regular backups to prevent data loss.</li>
        </ul>
      </Section>

      <Section title="6. User Rights">
        <p>Under applicable Israeli privacy law, you have the following rights:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li><strong>Access</strong> — request a copy of your personal data.</li>
          <li><strong>Correction</strong> — request correction of inaccurate or outdated information.</li>
          <li><strong>Deletion</strong> — request deletion of your data (subject to legal limitations).</li>
          <li><strong>Portability</strong> — receive your data in a structured format.</li>
          <li><strong>Objection</strong> — object to certain data processing.</li>
        </ul>
        <p>To exercise these rights, please contact us using the details at the end of this document.</p>
      </Section>

      <Section title="7. Data Retention">
        <ul className="list-disc space-y-1 ps-5">
          <li>Account data is retained as long as the account is active.</li>
          <li>After account cancellation, data is retained for 30 days before permanent deletion.</li>
          <li>Logs and usage data may be retained for up to 12 months for security and analysis purposes.</li>
        </ul>
      </Section>

      <Section title="8. Changes to This Policy">
        <p>
          We may update this policy from time to time. Material changes will be
          published on the website and notified to users. Continued use after an
          update constitutes acceptance of the updated policy.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>For any questions about this privacy policy or to exercise your rights, please contact us:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li>WhatsApp: <a href="https://wa.me/972526843000" className="text-blue-600 hover:underline" dir="ltr">+972-52-684-3000</a></li>
          <li>Email: <a href="mailto:Yardensamorai6@gmail.com" className="text-blue-600 hover:underline">Yardensamorai6@gmail.com</a></li>
        </ul>
      </Section>
    </>
  );
}

export default function PrivacyPage() {
  const t = useT();
  const isHe = t("lang" as never) === "he" || true;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-slate-900">
              <CalendarDays className="size-3.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">BookIT</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            {isHe ? "חזרה לדף הבית" : "Back to home"}
            <ArrowRight className={`size-3.5 ${!isHe ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {isHe ? "מדיניות פרטיות" : "Privacy Policy"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isHe ? "עדכון אחרון: מרץ 2026" : "Last updated: March 2026"}
          </p>
        </div>

        <div className="space-y-8">
          {isHe ? <HebrewContent /> : <EnglishContent />}
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-400">
          <Link href="/terms" className="text-blue-600 hover:underline">
            {isHe ? "תנאי שימוש" : "Terms of Service"}
          </Link>
          <span className="mx-2">&middot;</span>
          <Link href="/" className="text-slate-500 hover:underline">
            {isHe ? "דף הבית" : "Home"}
          </Link>
        </div>
      </main>
    </div>
  );
}
