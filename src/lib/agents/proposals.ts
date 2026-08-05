import { get, put, listKeys, getMany } from "@/lib/store";
import type { ThemeOverrides, ContentOverrides, ImageOverrides } from "@/lib/settings";

export const AGENT_STORE = "alta-agent";

export type ProposalStatus = "pending" | "approved" | "rejected" | "expired";

export type Proposal = {
  id: string;
  siteId: string;
  createdAt: string;
  expiresAt: string;
  status: ProposalStatus;
  /** Number that requested the change (kept for audit). */
  requestedBy: string;
  /** Human-readable description shown back over WhatsApp. */
  summary: string;
  /** The original instruction, verbatim. */
  instruction: string;
  patch: {
    theme?: ThemeOverrides;
    content?: ContentOverrides;
    images?: ImageOverrides;
  };
  appliedAt?: string;
  appliedRevision?: number;
};

/** Short, unambiguous ids: no 0/O or 1/I, because these get read aloud. */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function proposalId() {
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Proposals go stale — an approval texted a week later is almost never meant. */
export const PROPOSAL_TTL_MS = 24 * 60 * 60 * 1000;

export async function createProposal(
  input: Omit<Proposal, "id" | "createdAt" | "expiresAt" | "status">,
): Promise<Proposal> {
  const now = Date.now();
  const proposal: Proposal = {
    ...input,
    id: proposalId(),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + PROPOSAL_TTL_MS).toISOString(),
    status: "pending",
  };
  await put(AGENT_STORE, `proposals/${proposal.id}`, proposal);
  return proposal;
}

export async function readProposal(id: string): Promise<Proposal | null> {
  const p = await get<Proposal>(AGENT_STORE, `proposals/${id.toUpperCase()}`);
  if (!p) return null;
  if (p.status === "pending" && Date.parse(p.expiresAt) < Date.now()) {
    return { ...p, status: "expired" };
  }
  return p;
}

export async function saveProposal(proposal: Proposal) {
  await put(AGENT_STORE, `proposals/${proposal.id}`, proposal);
}

export async function listProposals(siteId?: string): Promise<Proposal[]> {
  const keys = await listKeys(AGENT_STORE, "proposals/");
  const all = await getMany<Proposal>(AGENT_STORE, keys);
  return all
    .filter((p) => !siteId || p.siteId === siteId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Append-only audit trail of everything an agent did. */
export async function logAction(entry: {
  siteId: string;
  actor: string;
  action: string;
  detail?: string;
}) {
  const at = new Date().toISOString();
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await put(AGENT_STORE, `audit/${at.slice(0, 10)}/${id}`, { ...entry, at, id });
}

export async function readAudit(day: string) {
  const keys = await listKeys(AGENT_STORE, `audit/${day}/`);
  return getMany<Record<string, unknown>>(AGENT_STORE, keys);
}
