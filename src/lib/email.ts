import { createTransport } from "nodemailer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://buruai.elmorilx.com";
const FROM = process.env.EMAIL_FROM ?? "BuruStudio <noreply@elmorilx.com>";

function transport() {
  return createTransport(process.env.EMAIL_SERVER ?? "");
}

export async function sendGenerationComplete({
  to,
  resultUrl,
  prompt,
  modelName,
  isVideo,
}: {
  to: string;
  resultUrl: string;
  prompt: string;
  modelName: string;
  isVideo: boolean;
}) {
  if (process.env.NODE_ENV !== "production") return; // skip in dev

  const type = isVideo ? "video" : "image";
  await transport().sendMail({
    to,
    from: FROM,
    subject: `Your ${type} is ready — BuruStudio`,
    text: `Your ${type} has been generated!\n\nPrompt: ${prompt}\nModel: ${modelName}\n\nView it in your gallery: ${APP_URL}/gallery`,
    html: `
      <div style="font-family:sans-serif;max-width:460px;margin:40px auto;padding:32px;background:#09090b;border-radius:12px;border:1px solid #27272a;color:#fafafa">
        <h1 style="font-size:18px;font-weight:600;margin:0 0 6px">Your ${type} is ready ✨</h1>
        <p style="color:#a1a1aa;font-size:13px;margin:0 0 20px">${prompt}</p>
        <a href="${APP_URL}/gallery"
          style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:500">
          View in Gallery
        </a>
        <p style="color:#52525b;font-size:11px;margin:24px 0 0">Generated with ${modelName} on BuruStudio</p>
      </div>
    `,
  });
}

export async function sendReferralBonus({
  to,
  credits,
  type,
}: {
  to: string;
  credits: number;
  type: "referrer" | "referee";
}) {
  if (process.env.NODE_ENV !== "production") return;

  const subject =
    type === "referrer"
      ? `Someone joined BuruStudio with your link — you earned ${credits} credits!`
      : `Welcome to BuruStudio — you earned ${credits} bonus credits!`;

  const body =
    type === "referrer"
      ? `A friend signed up using your referral link. We've added ${credits} credits to your account.`
      : `You joined BuruStudio via a referral link. We've added ${credits} bonus credits to your account on top of your welcome credits!`;

  await transport().sendMail({
    to,
    from: FROM,
    subject,
    text: `${body}\n\nStart creating: ${APP_URL}/studio`,
    html: `
      <div style="font-family:sans-serif;max-width:460px;margin:40px auto;padding:32px;background:#09090b;border-radius:12px;border:1px solid #27272a;color:#fafafa">
        <h1 style="font-size:18px;font-weight:600;margin:0 0 8px">${subject}</h1>
        <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px">${body}</p>
        <a href="${APP_URL}/studio"
          style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:500">
          Start creating
        </a>
      </div>
    `,
  });
}
