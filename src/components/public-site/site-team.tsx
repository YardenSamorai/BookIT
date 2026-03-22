import type { InferSelectModel } from "drizzle-orm";
import type { staffMembers } from "@/lib/db/schema";
import type { SiteTheme } from "@/lib/themes/presets";
import { t, type Locale } from "@/lib/i18n";

type StaffMember = InferSelectModel<typeof staffMembers>;

interface SiteTeamProps {
  staff: StaffMember[];
  content?: Record<string, unknown>;
  theme: SiteTheme;
  sectionIndex: number;
  locale: Locale;
}

export function SiteTeam({ staff, content = {}, theme, sectionIndex, locale }: SiteTeamProps) {
  if (staff.length === 0) return null;

  const title = (content.title as string) || t(locale, "pub.meet_team");
  const subtitle =
    (content.subtitle as string) ||
    t(locale, "pub.team_subtitle");
  const showBio = content.show_bio !== false;
  const cardStyle = (content.card_style as string) || "photo";

  return (
    <section
      id="team"
      className={`scroll-mt-20 ${theme.sectionSpacing} ${sectionIndex % 2 === 0 ? theme.sectionBgEven : theme.sectionBgOdd}`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2
            className={`${theme.headingSize.section} ${theme.headingWeight} ${theme.font} tracking-tight`}
            style={{ color: "var(--section-heading, #111827)" }}
          >
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-md" style={{ color: "var(--section-body, #6b7280)" }}>{subtitle}</p>
        </div>

        <div
          className={`mt-12 grid gap-8 ${
            cardStyle === "minimal"
              ? "sm:grid-cols-2 lg:grid-cols-4"
              : "sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {staff.map((member) =>
            cardStyle === "photo" ? (
              <PhotoCard key={member.id} member={member} theme={theme} showBio={showBio} />
            ) : cardStyle === "minimal" ? (
              <MinimalCard key={member.id} member={member} theme={theme} showBio={showBio} />
            ) : (
              <AvatarCard key={member.id} member={member} theme={theme} showBio={showBio} />
            )
          )}
        </div>
      </div>
    </section>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function PhotoCard({
  member,
  theme,
  showBio,
}: {
  member: StaffMember;
  theme: SiteTheme;
  showBio: boolean;
}) {
  return (
    <div
      className={`group flex flex-col overflow-hidden ${theme.radius.lg} ${theme.card} ${theme.cardHover} transition-all`}
    >
      <div className="relative h-64 overflow-hidden bg-gray-100">
        {member.imageUrl ? (
          <img
            src={member.imageUrl}
            alt={member.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center text-4xl font-bold text-white"
            style={{ backgroundColor: theme.secondaryColor }}
          >
            {getInitials(member.name)}
          </div>
        )}
      </div>

      <div className="p-6 text-center">
        <h3 className={`text-lg font-semibold ${theme.font}`} style={{ color: "var(--section-heading, #111827)" }}>
          {member.name}
        </h3>
        {member.roleTitle && (
          <p
            className="mt-1 text-sm font-medium"
            style={{ color: theme.secondaryColor }}
          >
            {member.roleTitle}
          </p>
        )}
        {showBio && member.bio && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--section-body, #6b7280)" }}>{member.bio}</p>
        )}
      </div>
    </div>
  );
}

function AvatarCard({
  member,
  theme,
  showBio,
}: {
  member: StaffMember;
  theme: SiteTheme;
  showBio: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center p-8 text-center ${theme.radius.lg} ${theme.card} ${theme.cardHover} transition-all`}
    >
      {member.imageUrl ? (
        <img
          src={member.imageUrl}
          alt={member.name}
          className="size-24 rounded-full object-cover ring-4 ring-gray-50"
        />
      ) : (
        <div
          className="flex size-24 items-center justify-center rounded-full text-2xl font-bold text-white"
          style={{ backgroundColor: theme.secondaryColor }}
        >
          {getInitials(member.name)}
        </div>
      )}

      <h3 className={`mt-5 text-lg font-semibold ${theme.font}`} style={{ color: "var(--section-heading, #111827)" }}>
        {member.name}
      </h3>
      {member.roleTitle && (
        <p
          className="mt-1 text-sm font-medium"
          style={{ color: theme.secondaryColor }}
        >
          {member.roleTitle}
        </p>
      )}
      {showBio && member.bio && (
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--section-body, #6b7280)" }}>{member.bio}</p>
      )}
    </div>
  );
}

function MinimalCard({
  member,
  theme,
  showBio,
}: {
  member: StaffMember;
  theme: SiteTheme;
  showBio: boolean;
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      {member.imageUrl ? (
        <img
          src={member.imageUrl}
          alt={member.name}
          className="size-16 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex size-16 items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ backgroundColor: theme.secondaryColor }}
        >
          {getInitials(member.name)}
        </div>
      )}

      <h3 className={`mt-3 text-base font-semibold ${theme.font}`} style={{ color: "var(--section-heading, #111827)" }}>
        {member.name}
      </h3>
      {member.roleTitle && (
        <p className="mt-0.5 text-xs" style={{ color: "var(--section-body, #9ca3af)" }}>
          {member.roleTitle}
        </p>
      )}
      {showBio && member.bio && (
        <p className="mt-2 text-xs leading-relaxed line-clamp-2" style={{ color: "var(--section-body, #6b7280)" }}>{member.bio}</p>
      )}
    </div>
  );
}
