import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REM Constroladoria - APP",
  description: "Gestão de pessoas e custos mensais por setor da REM Construtora.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/rem-controladoria.png?v=2",
    shortcut: "/rem-controladoria.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
