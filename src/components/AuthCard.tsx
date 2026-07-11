import type React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import accessHeroBackground from "../assets/access-hero-background.png";

export function AuthCard({
  title,
  subtitle,
  children,
  backTo = "/",
  scrollable = false
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  backTo?: string;
  scrollable?: boolean;
}) {
  return (
    <section className={`relative isolate bg-white px-5 py-4 sm:px-7 ${scrollable ? "min-h-dvh" : "h-dvh overflow-hidden"}`} style={{ backgroundImage: `url(${accessHeroBackground})`, backgroundPosition: "center top", backgroundRepeat: "no-repeat", backgroundSize: "100% auto" }}>
      <div className={`relative mx-auto w-full max-w-sm ${scrollable ? "pt-7" : "flex h-full flex-col"}`}>
        <header className={`relative flex shrink-0 items-center justify-center ${scrollable ? "" : "pt-4"}`}>
          <Link aria-label="Volver a seleccionar rol" className="absolute left-0 grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white/95 text-ink shadow-soft transition hover:bg-emergency-50 hover:text-emergency-700" to={backTo}>
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <BrandLogo withName />
        </header>
        <div className={`${scrollable ? "mt-9" : "my-auto"} rounded-[1.35rem] border border-slate-200/90 bg-white/95 p-5 shadow-[0_14px_34px_rgba(31,38,51,0.1)] backdrop-blur-sm sm:p-6`}>
          <h1 className="text-center text-xl font-black text-ink">{title}</h1>
          <p className="mt-1 text-center text-sm font-medium text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  );
}
