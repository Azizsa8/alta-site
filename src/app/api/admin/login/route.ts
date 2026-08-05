import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSession,
  verifyPassword,
  isLoginConfigured,
  requestIsHttps,
} from "@/lib/adminAuth";
import { rateLimit, clientKey } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Brute-force brake. Deliberately tight: there is exactly one valid account.
  if (!rateLimit(`login:${clientKey(req)}`, 5, 5 * 60_000).allowed) {
    return NextResponse.json(
      { ok: false, error: "محاولات كثيرة. حاول بعد قليل." },
      { status: 429 },
    );
  }

  if (!isLoginConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "لم يتم إعداد بيانات الدخول. اضبط ADMIN_USERNAME و ADMIN_PASSWORD_HASH و ADMIN_SESSION_SECRET.",
      },
      { status: 503 },
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "طلب غير صالح." }, { status: 400 });
  }

  const username = String(body.username ?? "");
  const password = String(body.password ?? "");

  const userOk = username === process.env.ADMIN_USERNAME;
  const passOk = verifyPassword(password, process.env.ADMIN_PASSWORD_HASH ?? "");

  // One message for both failure modes — telling the caller *which* half was
  // wrong turns a password guess into a username oracle.
  if (!userOk || !passOk) {
    return NextResponse.json(
      { ok: false, error: "بيانات الدخول غير صحيحة." },
      { status: 401 },
    );
  }

  const session = createSession(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, session.value, {
    httpOnly: true, // not readable by JS, so XSS cannot lift the session
    sameSite: "lax", // survives a normal navigation, blocks cross-site POSTs
    // Derived from the request: TLS terminates upstream on Netlify, so the
    // runtime sees plain http and only x-forwarded-proto knows the truth.
    secure: requestIsHttps(req),
    path: "/",
    maxAge: session.maxAge,
  });
  return res;
}
