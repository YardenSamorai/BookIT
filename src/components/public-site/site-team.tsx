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

  return (
    <section
      id="team"
      className={`scroll-mt-20 ${theme.sectionSpacing} ${sectionIndex % 2 === 0 ? theme.sectionBgEven : theme.sectionBgOdd}`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2
            className={`${theme.headingSize.section} ${theme.headingWeight} ${theme.font} tracking-tight text-gray-900`}
          >
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-gray-500">{subtitle}</p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <TeamCard
              key={member.id}
              member={member}
              theme={theme}
              showBio={showBio}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamCard({
  member,
  theme,
  showBio,
}: {
  member: StaffMember;
  theme: SiteTheme;
  showBio: boolean;
}) {
  const initials = member.name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
          {initials}
        </div>
      )}

      <h3 className={`mt-5 text-lg font-semibold text-gray-900 ${theme.font}`}>
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
        <p className="mt-3 text-sm leading-relaxed text-gray-500">{member.bio}</p>
      )}
    </div>
  );
}
