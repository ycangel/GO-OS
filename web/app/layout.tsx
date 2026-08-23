import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://go-society.angelo-pix.chatgpt.site"),
  title: "GO Society — GO OS v0.5 alpha reference instance",
  description:
    "The alpha self-application reference surface for GO OS v0.5, with selected mission, authority, evidence, privacy and evolution boundaries.",
  openGraph: {
    title: "GO Society",
    description: "The alpha self-application reference surface for GO OS v0.5.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "GO Society — GO OS v0.5 alpha reference instance.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GO Society",
    description: "The alpha self-application reference surface for GO OS v0.5.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
