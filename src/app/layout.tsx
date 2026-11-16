import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import Providers from "@/components/Providers";
import { PRODUCT_NAME } from "@/config";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://buruai.elmorilx.com";

export const metadata: Metadata = {
  title: {
    default: `${PRODUCT_NAME} — AI Image & Video Studio`,
    template: `%s | ${PRODUCT_NAME}`,
  },
  description:
    "Generate professional images and videos for your brand using the latest AI models. No subscription — pay only for what you create.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    siteName: PRODUCT_NAME,
    title: `${PRODUCT_NAME} — AI Image & Video Studio`,
    description:
      "Generate professional images and videos for your brand. Pay per generation, no subscription.",
    url: APP_URL,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "BuruStudio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PRODUCT_NAME} — AI Image & Video Studio`,
    description: "Generate professional images and videos for your brand. Pay per generation.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-zinc-100`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
