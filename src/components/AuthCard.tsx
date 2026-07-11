import type React from "react";
import { BrandLogo } from "./BrandLogo";

export function AuthCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid min-h-dvh place-items-center px-4 py-7 sm:px-5">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto w-fit"><BrandLogo large withName /></div>
        </div>
        <div className="app-card mt-6 p-5 sm:p-6">
          <h1 className="text-center text-xl font-black text-ink">{title}</h1>
          <p className="mt-1 text-center text-sm font-medium text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  );
}
