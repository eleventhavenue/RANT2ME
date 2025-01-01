// app/layout.tsx
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { auth } from "./auth";
import Providers from "@/components/Providers";
import UserGreeting from "@/components/UserGreeting";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RANT2ME - Your Empathetic AI Companion",
  description: "Express yourself freely with an AI that truly listens",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers session={session}>
          <div className="flex flex-col min-h-screen">
            {session?.user && <UserGreeting user={session.user} />}
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}