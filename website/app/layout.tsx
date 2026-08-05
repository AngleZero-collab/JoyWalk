import type { Metadata } from "next";
import "./globals.css";

const 網站路徑前綴 = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? "";
const 網站網址 = "https://anglezero-collab.github.io/SafeStride";
const 分享圖網址 = `${網站路徑前綴}/og.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(網站網址),
  title: "SafeStride 安行 | 高齡行者步行安全守護",
  description:
    "SafeStride 安行是一款高齡行者步行安全 App MVP，以手機端步行資料做本機分析，不使用攝像頭、不上傳個人資料。",
  icons: {
    icon: `${網站路徑前綴}/favicon.svg`,
    shortcut: `${網站路徑前綴}/favicon.svg`,
  },
  openGraph: {
    title: "SafeStride 安行",
    description: "高齡行者步行安全衛教與 App 展示",
    type: "website",
    url: 網站網址,
    images: [
      {
        url: 分享圖網址,
        width: 1200,
        height: 630,
        alt: "SafeStride 安行公開展示圖",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SafeStride 安行",
    description: "高齡行者步行安全衛教與 App 展示",
    images: [分享圖網址],
  },
};

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
