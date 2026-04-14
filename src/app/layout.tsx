// -- layout.tsx -- root layout for the entire app
// -- fonts, metadata, dark theme set chestundi

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Persona - Spoorthy Madasu",
  description: "Chat with Spoorthy's AI persona. Ask about skills, experience, projects, and book an interview.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${inter.className} h-full bg-gray-950 text-white`}>
        {children}
      </body>
    </html>
  );
}
