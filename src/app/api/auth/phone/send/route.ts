import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  return null;
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { phone: rawPhone } = body as { phone?: string };
  if (!rawPhone?.trim()) return NextResponse.json({ error: "Phone number is required" }, { status: 400 });

  const phone = normalizePhone(rawPhone.trim());
  if (!phone) return NextResponse.json({ error: "Enter a valid Nigerian mobile number (e.g. 08012345678)" }, { status: 400 });

  // Rate limit: one OTP per 60 seconds per number
  const recent = await prisma.phoneOtp.findFirst({
    where: { phone, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (recent) return NextResponse.json({ error: "Please wait a minute before requesting a new code" }, { status: 429 });

  // Expire old OTPs for this number
  await prisma.phoneOtp.deleteMany({ where: { phone, expires: { lt: new Date() } } });

  const code = String(Math.floor(100_000 + Math.random() * 900_000));
  const expires = new Date(Date.now() + 5 * 60_000);

  await prisma.phoneOtp.create({ data: { phone, code, expires } });

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    // Dev / staging: log to console instead of sending
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPhone OTP for ${phone}: ${code}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return NextResponse.json({ ok: true, dev: true });
  }

  const smsRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        From: fromNumber,
        Body: `Your BuruStudio verification code is ${code}. Valid for 5 minutes.`,
      }),
    }
  );

  if (!smsRes.ok) {
    const err = await smsRes.json() as { message?: string };
    return NextResponse.json({ error: err.message ?? "Failed to send SMS" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
