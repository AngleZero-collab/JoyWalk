import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const 標頭 = await headers();
  const 主機 = 標頭.get("x-forwarded-host") ?? 標頭.get("host") ?? "localhost:3000";
  const 協定 = 主機.includes("localhost") ? "http" : "https";
  const 網站網址 = new URL(`${協定}://${主機}`);
  const 分享圖 = new URL("/og.jpg", 網站網址).toString();

  return {
    metadataBase: 網站網址,
    title: "AI 陪走夥伴 | 高齡行人過馬路安全守護",
    description:
      "AI 陪走夥伴是一款以 Edge AI 與零干擾介面協助高齡行人判斷紅綠燈秒數的 MVP Demo。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "AI 陪走夥伴",
      description: "讓高齡行人安心過馬路",
      type: "website",
      url: 網站網址,
      images: [
        {
          url: 分享圖,
          width: 1200,
          height: 630,
          alt: "AI 陪走夥伴公開展示圖",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "AI 陪走夥伴",
      description: "讓高齡行人安心過馬路",
      images: [分享圖],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant-TW">
      <body>{children}</body>
    </html>
  );
}
