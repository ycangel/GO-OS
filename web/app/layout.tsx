import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://go-society.angelo-pix.chatgpt.site"),
  title: "GO Society — The first living organization on GO OS",
  description:
    "A self-evolving organization for self-evolving organizations. GO Society is the living reference implementation of GO OS.",
  openGraph: {
    title: "GO Society",
    description: "A self-evolving organization for self-evolving organizations.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "GO Society — A self-evolving organization for self-evolving organizations.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GO Society",
    description: "A self-evolving organization for self-evolving organizations.",
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
