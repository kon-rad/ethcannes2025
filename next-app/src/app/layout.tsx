import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WagmiProvider from '@/components/WagmiProvider'
import Header from '@/components/Header'
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Influencer Platform",
  description: "Create and manage AI characters with blockchain payments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MiniKitProvider>
          <WagmiProvider>
            {children}
          </WagmiProvider>
        </MiniKitProvider>
      </body>
    </html>
  );
}
