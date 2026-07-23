import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "ImageBoard",
  description: "Quadro interativo de imagens",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex h-screen flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <Link href="/" className="text-lg font-semibold">
              🖼️ ImageBoard
            </Link>
          </header>
          <main className="min-h-0 flex-1">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
