import { NextResponse } from "next/server";
import { createTransport } from "nodemailer";
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

  const { phone: rawPhone, email: rawEmail } = body as { phone?: string; email?: string };
  if (!rawPhone?.trim()) return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  if (!rawEmail?.trim() || !rawEmail.includes("@"))
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });

  const phone = normalizePhone(rawPhone.trim());
  if (!phone) return NextResponse.json({ error: "Enter a valid Nigerian mobile number (e.g. 08012345678)" }, { status: 400 });

  const email = rawEmail.trim().toLowerCase();

  // Rate limit: one OTP per 60 seconds per number
  const recent = await prisma.phoneOtp.findFirst({
    where: { phone, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (recent) return NextResponse.json({ error: "Please wait a minute before requesting a new code" }, { status: 429 });

  // Clear expired OTPs for this number
  await prisma.phoneOtp.deleteMany({ where: { phone, expires: { lt: new Date() } } });

  const code = String(Math.floor(100_000 + Math.random() * 900_000));
  const expires = new Date(Date.now() + 5 * 60_000);

  await prisma.phoneOtp.create({ data: { phone, code, expires } });

  const emailServer = process.env.EMAIL_SERVER;
  const emailFrom = process.env.EMAIL_FROM ?? "BuruStudio <noreply@burustudio.com>";

  if (!emailServer) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPhone OTP for ${phone} → ${email}: ${code}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return NextResponse.json({ ok: true, dev: true });
  }

  const transport = createTransport(emailServer);
  await transport.sendMail({
    to: email,
    from: emailFrom,
    subject: "Your BuruStudio sign-in code",
    text: `Your BuruStudio sign-in code is ${code}. It expires in 5 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:40px auto;padding:32px;background:#09090b;border-radius:12px;border:1px solid #27272a;color:#fafafa">
        <h1 style="font-size:18px;font-weight:600;margin:0 0 8px">Your sign-in code</h1>
        <p style="color:#a1a1aa;margin:0 0 24px;font-size:14px">Use this code to sign in to BuruStudio. It expires in 5 minutes.</p>
        <div style="text-align:center;padding:20px;background:#18181b;border-radius:8px;border:1px solid #27272a;margin-bottom:24px">
          <span style="font-size:36px;font-weight:800;letter-spacing:0.3em;color:#a78bfa;font-family:monospace">${code}</span>
        </div>
        <p style="color:#52525b;font-size:12px;margin:0">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
