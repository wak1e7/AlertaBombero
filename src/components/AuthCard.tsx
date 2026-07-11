import type React from "react";
import { BrandLogo } from "./BrandLogo";
import accessHeroBackground from "../assets/access-hero-background.png";

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
    <section className="relative isolate min-h-dvh overflow-hidden bg-white px-5 py-7 sm:px-7" style={{ backgroundImage: `url(${accessHeroBackground})`, backgroundPosition: "center top", backgroundRepeat: "no-repeat", backgroundSize: "100% auto" }}>
      <div className="relative mx-auto w-full max-w-sm pt-7">
        <div className="flex justify-center"><BrandLogo withName /></div>
        <div className="mt-9 rounded-[1.35rem] border border-slate-200/90 bg-white/95 p-5 shadow-[0_14px_34px_rgba(31,38,51,0.1)] backdrop-blur-sm sm:p-6">
          <h1 className="text-center text-xl font-black text-ink">{title}</h1>
          <p className="mt-1 text-center text-sm font-medium text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  );
}
