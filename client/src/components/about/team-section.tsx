import Image from "next/image";

type TeamMember = {
  name: string;
  role: string;
  photo: string;
};

const TEAM: TeamMember[] = [
  { name: "Marco Rossi", role: "Head Pizza Chef", photo: "/brand/about/team-marco-rossi.png" },
  { name: "Emily Watson", role: "Co-Founder / Operations", photo: "/brand/about/team-emily-watson.png" },
  { name: "David Vance", role: "Logistics Engineer", photo: "/brand/about/team-david-vance.png" },
];

/** About: The People Behind The Pizza (Figma 97:2473). */
export function TeamSection() {
  return (
    <section
      className="flex w-full flex-col items-center gap-64 bg-white p-96 max-lg:gap-[40px] max-lg:px-[40px] max-lg:py-[80px] max-sm:gap-[32px] max-sm:px-[20px] max-sm:py-[64px]"
      aria-labelledby="team-title"
    >
      <div className="flex w-full flex-col items-center gap-12 text-center leading-[normal]">
        <p className="font-heading text-16 font-extrabold uppercase leading-[normal] text-pw-green-700 max-lg:text-[14px] max-sm:text-[13px]">
          THE PIZZAWAY FAMILY
        </p>
        <h2
          id="team-title"
          className="wrap-break-word font-heading text-44 font-black leading-[normal] text-pw-ink max-lg:text-[length:clamp(30px,5vw,40px)] max-lg:leading-[1.15] max-sm:text-[length:clamp(26px,8vw,34px)]"
        >
          The People Behind The Pizza
        </h2>
      </div>

      {/* Desktop: 3 flex columns; tablet: 3-col grid; <= 760px: single column. */}
      <ul className="m-0 flex w-full list-none items-start gap-32 p-0 max-lg:grid max-lg:grid-cols-3 max-lg:gap-[20px] max-[760px]:mx-auto max-[760px]:max-w-[420px] max-[760px]:grid-cols-1 max-[760px]:gap-[32px] max-sm:max-w-none">
        {TEAM.map((member) => (
          <li key={member.name} className="flex min-w-1 flex-[1_0_0] flex-col items-start gap-20 max-lg:min-w-0 max-lg:gap-[14px]">
            <div className="relative h-320 w-full overflow-hidden rounded-24 max-lg:aspect-[37/30] max-lg:h-auto max-lg:rounded-[20px]">
              <Image
                src={member.photo}
                alt={`${member.name}, ${member.role}`}
                fill
                sizes="(max-width: 760px) 92vw, (max-width: 1023px) 32vw, 28vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col items-center gap-4 leading-[normal] max-lg:items-start max-lg:gap-[4px]">
              <h3 className="font-heading text-20 font-extrabold leading-[normal] text-pw-ink max-lg:text-[18px] max-sm:text-[19px]">
                {member.name}
              </h3>
              <p className="font-body text-14 font-normal leading-[normal] text-pw-muted max-lg:text-[14px]">
                {member.role}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
