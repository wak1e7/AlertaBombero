import type React from "react";
import { Flame } from "lucide-react";

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
    <section className="grid min-h-dvh place-items-center px-5 py-8">
      <div className="w-full rounded-lg border border-emergency-100 bg-white p-5 shadow-soft">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emergency-50">
            <Flame className="h-8 w-8 text-emergency-600" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-emergency-600">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}
