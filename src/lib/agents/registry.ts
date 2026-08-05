/**
 * Which client site each keyword wakes, and who is allowed to drive it.
 *
 * SAFETY PROPERTY — do not remove: an empty `allowedSenders` list trusts
 * NOBODY. A project keyword is not a secret (it gets forwarded, screenshotted,
 * read aloud), so a keyword alone must never grant write access to a client's
 * live site. The number must also be on the allow-list.
 */

export type Capability = "theme" | "content" | "images" | "preview" | "reports";

export type AgentSite = {
  /** Stable id used in proposal records and logs. */
  id: string;
  name: string;
  /** Case-insensitive keyword a client texts to wake this agent. */
  keyword: string;
  /** Extra keywords that route to the same agent. */
  aliases?: string[];
  host: "netlify" | "vercel";
  siteUrl: string;
  capabilities: Capability[];
  /**
   * E.164 numbers permitted to issue commands, digits only, no "+".
   * Populated from AGENT_ALLOWED_SENDERS_<ID> so numbers are never committed.
   */
  allowedSenders: string[];
  locale: "ar" | "en";
};

function sendersFor(id: string): string[] {
  const raw = process.env[`AGENT_ALLOWED_SENDERS_${id.toUpperCase()}`] ?? "";
  return raw
    .split(",")
    .map((s) => s.replace(/[^\d]/g, ""))
    .filter((s) => s.length >= 8);
}

export function getSites(): AgentSite[] {
  return [
    {
      id: "alta",
      name: "شركة التا للاستثمار",
      keyword: "alta",
      aliases: ["التا", "ألتا"],
      host: "netlify",
      siteUrl: process.env.URL ?? "https://www.alta.sa",
      capabilities: ["theme", "content", "images", "preview", "reports"],
      allowedSenders: sendersFor("alta"),
      locale: "ar",
    },
    {
      id: "hospitality",
      name: "ALTA Hospitality AI",
      keyword: "hospitality",
      aliases: ["ضيافة", "الضيافة"],
      host: "netlify",
      siteUrl: process.env.HOSPITALITY_SITE_URL ?? "https://hospitality.alta.sa",
      capabilities: ["theme", "content", "preview", "reports"],
      allowedSenders: sendersFor("hospitality"),
      locale: "ar",
    },
  ];
}

/** Resolve the first word of a message to a site, or null. */
export function resolveSite(text: string): AgentSite | null {
  const first = text.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!first) return null;
  return (
    getSites().find(
      (s) =>
        s.keyword.toLowerCase() === first ||
        (s.aliases ?? []).some((a) => a.toLowerCase() === first),
    ) ?? null
  );
}

export function isAuthorised(site: AgentSite, sender: string) {
  const digits = sender.replace(/[^\d]/g, "");
  // Empty allow-list => closed. This is the fail-closed default, on purpose.
  if (site.allowedSenders.length === 0) return false;
  return site.allowedSenders.includes(digits);
}

export function canDo(site: AgentSite, capability: Capability) {
  return site.capabilities.includes(capability);
}
