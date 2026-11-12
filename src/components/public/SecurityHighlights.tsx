import {
  Database,
  Download,
  Eye,
  FileLock2,
  HandHeart,
  KeyRound,
  ListChecks,
  LockKeyhole,
  ShieldAlert,
  Timer,
  type LucideIcon,
} from "lucide-react";

type Highlight = { icon: LucideIcon; title: string; text: string };

/**
 * What protects every account and how Sterl treats information. Shared by the home page's Security
 * section and the full /security page, so the two can never say different things.
 * Every line must stay TRUE to what is built: planned items say "coming".
 */
export const PROTECTIONS: readonly Highlight[] = [
  {
    icon: KeyRound,
    title: "Your password is never stored",
    text: "Only a one-way fingerprint of it (an Argon2id hash) is kept. Even Sterl can't read your password back.",
  },
  {
    icon: Eye,
    title: "You only ever see your own money",
    text: "Every request is checked against who is logged in. Someone else's account simply doesn't exist for you.",
  },
  {
    icon: Timer,
    title: "Idle sessions end",
    text: "Step away for an hour and you're logged out on the server, not just in the browser.",
  },
  {
    icon: LockKeyhole,
    title: "Protection on every request",
    text: "Forged requests from other websites are refused, and the login cookie can't be read by page scripts.",
  },
  {
    icon: ListChecks,
    title: "Every payment happens exactly once",
    text: "A double tap or a dropped connection can never send money twice, and every movement is recorded.",
  },
  {
    icon: ShieldAlert,
    title: "Guessing gets slowed down",
    text: "Too many wrong passwords from one place and Sterl stops answering for a while, so passwords can't be guessed at speed.",
  },
];

export const CONFIDENTIALITY: readonly Highlight[] = [
  {
    icon: Database,
    title: "Only what's needed",
    text: "Sterl keeps only what running your account needs, and your display settings stay in your own browser.",
  },
  {
    icon: HandHeart,
    title: "Never sold, never shared",
    text: "Your information isn't sold, rented or passed to advertisers. Ever.",
  },
  {
    icon: FileLock2,
    title: "A record that can't be rewritten",
    text: "Every login and payment goes into an audit log that can only be added to, never edited or deleted.",
  },
  {
    icon: Download,
    title: "Your data, your choice (coming)",
    text: "Download a copy of everything Sterl holds about you, or close your account and have it removed.",
  },
];

/** A grid of icon cards. `columns` = how many across on wide screens. */
export function HighlightGrid({ items, columns = 3 }: { items: readonly Highlight[]; columns?: 2 | 3 }) {
  return (
    <ul className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}>
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="panel flex flex-col gap-3 rounded-3xl p-6">
          <span aria-hidden="true" className="chip h-11 w-11">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted">{text}</p>
        </li>
      ))}
    </ul>
  );
}
