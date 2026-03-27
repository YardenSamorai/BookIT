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
          ברוכים הבאים ל-BookIT (להלן: &quot;המערכת&quot; או &quot;השירות&quot;). המערכת מופעלת
          על ידי BookIT (להלן: &quot;החברה&quot;, &quot;אנחנו&quot;). השימוש במערכת
          מהווה הסכמה לתנאים המפורטים להלן. אם אינך מסכים לתנאים אלה, אנא הימנע
          משימוש בשירות.
        </p>
      </Section>

      <Section title="2. הגדרות">
        <ul className="list-disc space-y-1 ps-5">
          <li><strong>&quot;בעל עסק&quot;</strong> — משתמש שנרשם למערכת לצורך ניהול העסק שלו.</li>
          <li><strong>&quot;לקוח סופי&quot;</strong> — אדם שקובע תור או רוכש שירות דרך המערכת.</li>
          <li><strong>&quot;שירות&quot;</strong> — פלטפורמת BookIT, כולל אתר ההזמנות, לוח הבקרה, מערכת ההודעות וכל הכלים הנלווים.</li>
          <li><strong>&quot;תוכן משתמש&quot;</strong> — כל מידע, טקסט, תמונה או נתון שהמשתמש מעלה למערכת.</li>
        </ul>
      </Section>

      <Section title="3. רישום וחשבון">
        <p>
          בעת ההרשמה, עליך לספק פרטים מדויקים ועדכניים. אתה אחראי לשמירה על
          סודיות פרטי הגישה שלך ולכל פעולה המבוצעת תחת חשבונך. יש להודיע לנו
          מיידית על כל שימוש לא מורשה בחשבון.
        </p>
      </Section>

      <Section title="4. תיאור השירות">
        <p>BookIT מספקת פלטפורמת SaaS לניהול עסקים הכוללת:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li>מערכת קביעת תורים ופגישות מקוונת</li>
          <li>אתר עסקי מותאם אישית עם עורך ויזואלי</li>
          <li>ניהול לקוחות (CRM)</li>
          <li>ניהול צוות ושירותים</li>
          <li>שליחת הודעות WhatsApp ו-SMS אוטומטיות</li>
          <li>כרטיסיות ומנויים</li>
          <li>חוגים ואימונים קבוצתיים</li>
          <li>דוחות וסטטיסטיקות</li>
        </ul>
      </Section>

      <Section title="5. תוכניות ותשלום">
        <ul className="list-disc space-y-1 ps-5">
          <li>המערכת מציעה תקופת ניסיון חינמית בת 14 ימים.</li>
          <li>לאחר תקופת הניסיון, נדרש מנוי בתשלום בהתאם לתוכניות המפורסמות באתר.</li>
          <li>התשלום מתבצע על בסיס חודשי או שנתי, בהתאם לבחירת המשתמש.</li>
          <li>המחירים כוללים מע&quot;מ כנדרש בחוק.</li>
          <li>החברה רשאית לעדכן מחירים בהודעה מראש של 30 יום.</li>
          <li>ביטול מנוי ייכנס לתוקף בסוף תקופת החיוב הנוכחית.</li>
        </ul>
      </Section>

      <Section title="6. שימוש מותר ואסור">
        <p>המשתמש מתחייב:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li>להשתמש בשירות למטרות חוקיות בלבד.</li>
          <li>לא לשלוח ספאם או הודעות שיווקיות לא רצויות דרך המערכת.</li>
          <li>לא להעלות תוכן פוגעני, מפר זכויות יוצרים או בלתי חוקי.</li>
          <li>לא לנסות לפרוץ, להעתיק או לבצע הנדסה הפוכה של המערכת.</li>
          <li>לא להשתמש במערכת באופן שעלול לפגוע בביצועים או בזמינות השירות.</li>
        </ul>
      </Section>

      <Section title="7. הודעות SMS ו-WhatsApp">
        <ul className="list-disc space-y-1 ps-5">
          <li>שליחת הודעות כפופה למכסה החודשית המוגדרת בתוכנית שלך.</li>
          <li>בעל העסק אחראי לתוכן ההודעות הנשלחות בשמו ללקוחותיו.</li>
          <li>ההודעות נשלחות דרך ספקי צד שלישי (Twilio) ואנו לא אחראים לעיכובים או כשלים מצד הספק.</li>
          <li>אין להשתמש במערכת ההודעות לשליחת ספאם או תוכן שיווקי ללא הסכמת הנמען.</li>
        </ul>
      </Section>

      <Section title="8. קניין רוחני">
        <ul className="list-disc space-y-1 ps-5">
          <li>כל הזכויות במערכת BookIT, כולל עיצוב, קוד, לוגו וסימני מסחר, שייכות לחברה.</li>
          <li>המשתמש שומר על הבעלות המלאה על התוכן שהוא מעלה למערכת.</li>
          <li>בהעלאת תוכן למערכת, המשתמש מעניק לנו רישיון שימוש מוגבל לצורך הפעלת השירות.</li>
        </ul>
      </Section>

      <Section title="9. הגבלת אחריות">
        <ul className="list-disc space-y-1 ps-5">
          <li>השירות מסופק &quot;כמו שהוא&quot; (AS IS) ללא אחריות מכל סוג.</li>
          <li>החברה אינה אחראית לנזקים עקיפים, מיוחדים או תוצאתיים הנובעים מהשימוש בשירות.</li>
          <li>החברה אינה אחראית לאובדן נתונים, הפסד הכנסות או הפרעות בשירות.</li>
          <li>אחריות החברה המרבית מוגבלת לסכום ששילם המשתמש ב-12 החודשים האחרונים.</li>
        </ul>
      </Section>

      <Section title="10. ביטול וסיום">
        <ul className="list-disc space-y-1 ps-5">
          <li>המשתמש רשאי לבטל את חשבונו בכל עת.</li>
          <li>החברה רשאית להשעות או לסגור חשבון שמפר תנאים אלה.</li>
          <li>עם ביטול החשבון, הגישה לנתונים תישמר למשך 30 יום, ולאחר מכן יימחקו.</li>
        </ul>
      </Section>

      <Section title="11. שינויים בתנאים">
        <p>
          החברה רשאית לעדכן תנאים אלה מעת לעת. שינויים מהותיים יפורסמו באתר
          ויישלחו בהודעה למשתמשים רשומים. המשך השימוש בשירות לאחר עדכון התנאים
          מהווה הסכמה לתנאים המעודכנים.
        </p>
      </Section>

      <Section title="12. דין חל וסמכות שיפוט">
        <p>
          תנאים אלה כפופים לחוקי מדינת ישראל. כל סכסוך הנוגע לתנאים אלה יידון
          בבתי המשפט המוסמכים במחוז תל אביב-יפו.
        </p>
      </Section>

      <Section title="13. יצירת קשר">
        <p>לכל שאלה בנוגע לתנאי השימוש, ניתן לפנות אלינו:</p>
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
          Welcome to BookIT (hereinafter: &quot;the System&quot; or &quot;the Service&quot;). The
          system is operated by BookIT (hereinafter: &quot;the Company&quot;, &quot;we&quot;). Use
          of the system constitutes agreement to the terms detailed below. If you
          do not agree to these terms, please refrain from using the service.
        </p>
      </Section>

      <Section title="2. Definitions">
        <ul className="list-disc space-y-1 ps-5">
          <li><strong>&quot;Business Owner&quot;</strong> — A user who registers to manage their business.</li>
          <li><strong>&quot;End Customer&quot;</strong> — A person who books an appointment or purchases a service.</li>
          <li><strong>&quot;Service&quot;</strong> — The BookIT platform, including the booking site, dashboard, messaging system, and all related tools.</li>
          <li><strong>&quot;User Content&quot;</strong> — Any information, text, image, or data uploaded by the user.</li>
        </ul>
      </Section>

      <Section title="3. Registration and Account">
        <p>
          When registering, you must provide accurate and up-to-date information.
          You are responsible for maintaining the confidentiality of your access
          credentials and for all activity conducted under your account. You must
          notify us immediately of any unauthorized use.
        </p>
      </Section>

      <Section title="4. Service Description">
        <p>BookIT provides a SaaS platform for business management, including:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li>Online appointment and booking system</li>
          <li>Custom business website with visual editor</li>
          <li>Customer management (CRM)</li>
          <li>Staff and service management</li>
          <li>Automated WhatsApp and SMS notifications</li>
          <li>Cards and subscriptions</li>
          <li>Group classes and training</li>
          <li>Reports and statistics</li>
        </ul>
      </Section>

      <Section title="5. Plans and Payment">
        <ul className="list-disc space-y-1 ps-5">
          <li>The system offers a 14-day free trial period.</li>
          <li>After the trial, a paid subscription is required per the plans published on the website.</li>
          <li>Payment is made on a monthly or annual basis, as chosen by the user.</li>
          <li>Prices include VAT as required by law.</li>
          <li>The company reserves the right to update prices with 30 days&apos; notice.</li>
          <li>Subscription cancellation takes effect at the end of the current billing period.</li>
        </ul>
      </Section>

      <Section title="6. Permitted and Prohibited Use">
        <p>The user agrees to:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li>Use the service for lawful purposes only.</li>
          <li>Not send spam or unsolicited marketing messages through the system.</li>
          <li>Not upload offensive, copyright-infringing, or illegal content.</li>
          <li>Not attempt to hack, copy, or reverse-engineer the system.</li>
          <li>Not use the system in a way that could impair performance or availability.</li>
        </ul>
      </Section>

      <Section title="7. SMS and WhatsApp Messages">
        <ul className="list-disc space-y-1 ps-5">
          <li>Message sending is subject to the monthly quota defined in your plan.</li>
          <li>The business owner is responsible for the content of messages sent on their behalf.</li>
          <li>Messages are sent through third-party providers (Twilio) and we are not liable for delays or failures on the provider&apos;s side.</li>
          <li>The messaging system must not be used for spam or unsolicited marketing.</li>
        </ul>
      </Section>

      <Section title="8. Intellectual Property">
        <ul className="list-disc space-y-1 ps-5">
          <li>All rights to the BookIT system, including design, code, logo, and trademarks, belong to the company.</li>
          <li>The user retains full ownership of the content they upload.</li>
          <li>By uploading content, the user grants us a limited license to use it for operating the service.</li>
        </ul>
      </Section>

      <Section title="9. Limitation of Liability">
        <ul className="list-disc space-y-1 ps-5">
          <li>The service is provided &quot;AS IS&quot; without warranty of any kind.</li>
          <li>The company is not liable for indirect, special, or consequential damages arising from use of the service.</li>
          <li>The company is not responsible for data loss, revenue loss, or service interruptions.</li>
          <li>Maximum liability is limited to the amount paid by the user in the preceding 12 months.</li>
        </ul>
      </Section>

      <Section title="10. Cancellation and Termination">
        <ul className="list-disc space-y-1 ps-5">
          <li>The user may cancel their account at any time.</li>
          <li>The company may suspend or close accounts that violate these terms.</li>
          <li>Upon cancellation, data will be retained for 30 days before deletion.</li>
        </ul>
      </Section>

      <Section title="11. Changes to Terms">
        <p>
          The company may update these terms from time to time. Material changes
          will be published on the website and notified to registered users.
          Continued use of the service after an update constitutes acceptance of
          the updated terms.
        </p>
      </Section>

      <Section title="12. Governing Law and Jurisdiction">
        <p>
          These terms are governed by the laws of the State of Israel. Any dispute
          shall be adjudicated in the competent courts of the Tel Aviv-Jaffa
          district.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>For any questions regarding these terms, please contact us:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li>WhatsApp: <a href="https://wa.me/972526843000" className="text-blue-600 hover:underline" dir="ltr">+972-52-684-3000</a></li>
          <li>Email: <a href="mailto:Yardensamorai6@gmail.com" className="text-blue-600 hover:underline">Yardensamorai6@gmail.com</a></li>
        </ul>
      </Section>
    </>
  );
}

export default function TermsPage() {
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
            {isHe ? "תנאי שימוש" : "Terms of Service"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isHe ? "עדכון אחרון: מרץ 2026" : "Last updated: March 2026"}
          </p>
        </div>

        <div className="space-y-8">
          {isHe ? <HebrewContent /> : <EnglishContent />}
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-400">
          <Link href="/privacy" className="text-blue-600 hover:underline">
            {isHe ? "מדיניות פרטיות" : "Privacy Policy"}
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
