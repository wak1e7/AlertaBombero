import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlertaBombero Ciudadano",
  description: "Aplicación ciudadana para reportar emergencias y compartir ubicación.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-PE"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
