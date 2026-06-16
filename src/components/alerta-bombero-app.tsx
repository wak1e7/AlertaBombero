"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Bell,
  Contrast,
  FileImage,
  Flame,
  Home,
  IdCard,
  ImagePlus,
  LocateFixed,
  Map,
  MapPin,
  MessageSquareText,
  Phone,
  Rows3,
  Settings,
  ShieldCheck,
  Type,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Step =
  | "phone"
  | "otp"
  | "profile"
  | "welcome"
  | "home"
  | "report"
  | "sending"
  | "map"
  | "reports"
  | "profile-tab"
  | "settings"
  | "accessibility";

type ReportDraft = {
  type: "Incendio" | "Rescate" | "Emergencia médica" | "Fuga de gas";
  location: string;
  description: string;
};

type EvidenceItem = {
  id: string;
  name: string;
  kind: "foto" | "video" | "archivo";
};

type ColorFilter = "none" | "grayscale" | "protanopia" | "deuteranopia" | "tritanopia";

type AccessibilitySettings = {
  textScale: number;
  boldText: boolean;
  highContrast: boolean;
  reduceTransparency: boolean;
  colorFilter: ColorFilter;
  readingMask: boolean;
  dyslexiaFont: boolean;
  lineSpacing: number;
  reduceMotion: boolean;
  largerTouchTargets: boolean;
};

const FIXED_OTP = "123456";

const defaultAccessibilitySettings: AccessibilitySettings = {
  textScale: 1,
  boldText: false,
  highContrast: false,
  reduceTransparency: false,
  colorFilter: "none",
  readingMask: false,
  dyslexiaFont: false,
  lineSpacing: 1,
  reduceMotion: false,
  largerTouchTargets: false,
};

const emergencyTypes: ReportDraft["type"][] = [
  "Incendio",
  "Rescate",
  "Emergencia médica",
  "Fuga de gas",
];

const navItems = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "reports", label: "Reportes", icon: MessageSquareText },
  { id: "map", label: "Mapa", icon: Map },
  { id: "profile-tab", label: "Perfil", icon: User },
] satisfies Array<{ id: Step; label: string; icon: typeof Home }>;

export function AlertaBomberoApp() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(55);
  const [profile, setProfile] = useState({
    name: "",
    lastName: "",
    dni: "",
  });
  const [report, setReport] = useState<ReportDraft>({
    type: "Incendio",
    location: "Av. Luis Gonzales, 15021",
    description: "",
  });
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sendCountdown, setSendCountdown] = useState(3);
  const [progress, setProgress] = useState(12);
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(
    defaultAccessibilitySettings
  );

  const fullName = useMemo(() => {
    const value = `${profile.name} ${profile.lastName}`.trim();
    return value || "Juan Perez";
  }, [profile.lastName, profile.name]);

  useEffect(() => {
    if (step !== "otp" || otpTimer <= 0) {
      return;
    }

    const timer = window.setTimeout(() => setOtpTimer((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [otpTimer, step]);

  useEffect(() => {
    if (step !== "sending") {
      return;
    }

    const progressTimer = window.setInterval(() => {
      setProgress((value) => Math.min(value + 18, 96));
    }, 450);

    const countdownTimer = window.setInterval(() => {
      setSendCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(countdownTimer);
          window.clearInterval(progressTimer);
          setProgress(100);
          window.setTimeout(() => setStep("map"), 450);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(countdownTimer);
    };
  }, [step]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-text-scale",
      String(accessibilitySettings.textScale)
    );

    return () => {
      document.documentElement.style.removeProperty("--app-text-scale");
    };
  }, [accessibilitySettings.textScale]);

  function validatePhone() {
    const digits = phone.replace(/\D/g, "");

    if (digits.length < 9) {
      setErrors({ phone: "Ingresa un número de teléfono válido." });
      return;
    }

    setErrors({});
    setOtp("");
    setOtpTimer(55);
    setStep("otp");
  }

  function validateOtp() {
    if (otp !== FIXED_OTP) {
      setErrors({ otp: "El código ingresado no coincide. Usa 123456 para continuar." });
      return;
    }

    setErrors({});
    setStep("profile");
  }

  function validateProfile() {
    const nextErrors: Record<string, string> = {};

    if (!profile.name.trim()) {
      nextErrors.name = "Ingresa tu nombre.";
    }
    if (!profile.lastName.trim()) {
      nextErrors.lastName = "Ingresa tu apellido.";
    }
    if (profile.dni.replace(/\D/g, "").length !== 8) {
      nextErrors.dni = "El DNI debe tener 8 dígitos.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setStep("welcome");
    }
  }

  function submitReport() {
    const nextErrors: Record<string, string> = {};

    if (!report.location.trim()) {
      nextErrors.location = "Indica una ubicación para enviar el reporte.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setProgress(18);
      setSendCountdown(3);
      setStep("sending");
    }
  }

  function addEvidence(files: FileList | null, kind: EvidenceItem["kind"]) {
    if (!files?.length) {
      return;
    }

    const nextItems = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      kind,
    }));

    setEvidence((current) => [...current, ...nextItems].slice(0, 4));
  }

  function updateAccessibility(settings: AccessibilitySettings) {
    setAccessibilitySettings(settings);
  }

  const activeNav =
    step === "report" || step === "sending"
      ? "reports"
      : step === "settings" || step === "accessibility"
        ? "profile-tab"
        : step;
  const showBottomNav = [
    "home",
    "report",
    "reports",
    "map",
    "profile-tab",
  ].includes(step);

  return (
    <div
      data-text-scale={accessibilitySettings.textScale}
      data-bold-text={accessibilitySettings.boldText}
      data-high-contrast={accessibilitySettings.highContrast}
      data-reduce-transparency={accessibilitySettings.reduceTransparency}
      data-color-filter={accessibilitySettings.colorFilter}
      data-dyslexia-font={accessibilitySettings.dyslexiaFont}
      data-line-spacing={accessibilitySettings.lineSpacing}
      data-reduce-motion={accessibilitySettings.reduceMotion}
      data-large-targets={accessibilitySettings.largerTouchTargets}
      style={
        {
          "--accessibility-line-spacing": accessibilitySettings.lineSpacing,
        } as CSSProperties
      }
      className="accessibility-shell min-h-svh bg-background text-foreground"
    >
      {accessibilitySettings.readingMask ? <ReadingMask /> : null}
      <section className="mx-auto flex h-svh w-full max-w-[430px] flex-col overflow-hidden bg-background shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
        <div className="flex min-h-0 flex-1 flex-col px-5 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-5">
          {step !== "phone" && step !== "welcome" && step !== "sending" ? (
            <AppHeader
              showNotifications={["home", "report", "reports", "map", "profile-tab"].includes(step)}
              onBack={() => setStep(previousStep(step))}
            />
          ) : null}

          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              !["home", "reports", "map"].includes(step) && "mobile-scroll overflow-y-auto"
            )}
          >
            {step === "phone" ? (
              <PhoneScreen
                phone={phone}
                error={errors.phone}
                onPhoneChange={setPhone}
                onSubmit={validatePhone}
              />
            ) : null}

            {step === "otp" ? (
              <OtpScreen
                otp={otp}
                timer={otpTimer}
                error={errors.otp}
                onChange={setOtp}
                onResend={() => {
                  setOtp("");
                  setErrors({});
                  setOtpTimer(55);
                }}
                onSubmit={validateOtp}
              />
            ) : null}

            {step === "profile" ? (
              <ProfileInfoScreen
                profile={profile}
                errors={errors}
                onChange={setProfile}
                onSubmit={validateProfile}
              />
            ) : null}

            {step === "welcome" ? (
              <WelcomeScreen onStart={() => setStep("home")} />
            ) : null}

            {step === "home" ? (
              <HomeScreen
                fullName={fullName}
                onReport={() => {
                  setErrors({});
                  setStep("report");
                }}
              />
            ) : null}

            {step === "report" ? (
              <ReportScreen
                report={report}
                evidence={evidence}
                errors={errors}
                onChange={setReport}
                onAddEvidence={addEvidence}
                onRemoveEvidence={(id) =>
                  setEvidence((current) => current.filter((item) => item.id !== id))
                }
                onSubmit={submitReport}
              />
            ) : null}

            {step === "sending" ? (
              <SendingScreen
                countdown={sendCountdown}
                progress={progress}
                onCancel={() => setStep("report")}
              />
            ) : null}

            {step === "map" ? <MapScreen report={report} /> : null}

            {step === "reports" ? <ReportsScreen onReport={() => setStep("report")} /> : null}

            {step === "profile-tab" ? (
              <ProfileScreen fullName={fullName} phone={phone} onSettings={() => setStep("settings")} />
            ) : null}

            {step === "settings" ? (
              <SettingsScreen onAccessibility={() => setStep("accessibility")} />
            ) : null}

            {step === "accessibility" ? (
              <AccessibilityScreen
                settings={accessibilitySettings}
                onChange={updateAccessibility}
              />
            ) : null}
          </div>
        </div>

        {showBottomNav ? (
          <BottomNav active={activeNav} onNavigate={(target) => setStep(target)} />
        ) : null}
      </section>
    </div>
  );
}

function previousStep(step: Step): Step {
  const order: Step[] = ["phone", "otp", "profile", "welcome", "home", "report", "sending", "map"];
  const index = order.indexOf(step);

  if (step === "reports" || step === "profile-tab") {
    return "home";
  }

  if (step === "settings") {
    return "profile-tab";
  }

  if (step === "accessibility") {
    return "settings";
  }

  return order[Math.max(index - 1, 0)] ?? "phone";
}

function AppHeader({
  showNotifications,
  onBack,
}: {
  showNotifications: boolean;
  onBack: () => void;
}) {
  return (
    <header className="mb-5 flex items-center justify-between">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label="Volver"
        className="min-h-11 min-w-11 text-brand"
        onClick={onBack}
      >
        <ArrowLeft aria-hidden="true" />
      </Button>

      <div className="flex items-center gap-2">
        <BrandMark compact />
        <span className="text-base font-bold text-brand">AlertaBombero</span>
      </div>

      {showNotifications ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Notificaciones"
          className="min-h-11 min-w-11 text-brand"
        >
          <Bell aria-hidden="true" />
        </Button>
      ) : (
        <div className="size-11" aria-hidden="true" />
      )}
    </header>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-lg bg-white p-1 shadow-[0_14px_34px_rgba(0,0,0,0.12)] ring-1 ring-border",
        compact ? "size-11" : "size-24"
      )}
    >
      <Image
        src="/alertabombero-logo-clean.png"
        alt={compact ? "" : "Logo de AlertaBombero"}
        width={compact ? 44 : 96}
        height={compact ? 44 : 96}
        className="size-full object-contain"
        priority={!compact}
      />
    </div>
  );
}

function PhoneScreen({
  phone,
  error,
  onPhoneChange,
  onSubmit,
}: {
  phone: string;
  error?: string;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <section className="flex flex-col items-center gap-4 text-center">
        <BrandMark />
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-brand">AlertaBombero</h1>
          <p className="mx-auto max-w-[18rem] text-sm leading-6 text-muted-foreground">
            Reporta emergencias en tiempo real de manera rápida y eficiente.
          </p>
        </div>
      </section>

      <Card className="rounded-lg border-border shadow-[0_18px_48px_rgba(0,0,0,0.06)]">
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tu teléfono para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="phone">Número de teléfono</FieldLabel>
              <div className="flex gap-2">
                <div className="flex min-h-12 items-center gap-1 rounded-lg border border-input bg-muted px-3 text-sm font-semibold text-brand">
                  <span aria-hidden="true">PE</span>
                  <span>+51</span>
                </div>
                <Input
                  id="phone"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="999 999 999"
                  value={phone}
                  maxLength={9}
                  aria-invalid={Boolean(error)}
                  className="min-h-12 flex-1 bg-muted text-base"
                  onChange={(event) =>
                    onPhoneChange(event.target.value.replace(/\D/g, "").slice(0, 9))
                  }
                />
              </div>
              <FieldError>{error}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button type="button" className="min-h-12 w-full text-base font-bold" onClick={onSubmit}>
            Continuar
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Card>

      <section className="grid grid-cols-2 gap-3" aria-label="Beneficios principales">
        <FeatureMini icon={ShieldCheck} title="Datos Seguros" description="Encriptación de extremo a extremo." />
        <FeatureMini icon={Flame} title="Respuesta Rápida" description="Conexión directa con centrales." />
      </section>
    </div>
  );
}

function OtpScreen({
  otp,
  timer,
  error,
  onChange,
  onResend,
  onSubmit,
}: {
  otp: string;
  timer: number;
  error?: string;
  onChange: (value: string) => void;
  onResend: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <section className="flex flex-col items-center gap-4 text-center">
        <div className="grid size-16 place-items-center rounded-lg bg-muted text-primary">
          <MessageSquareText className="size-8" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold text-brand">Verifica tu número</h1>
          <p className="mx-auto max-w-[19rem] text-sm leading-6 text-muted-foreground">
            Ingresa el código de 6 dígitos enviado a tu teléfono.
          </p>
        </div>
      </section>

      <FieldGroup>
        <Field data-invalid={Boolean(error)} className="items-center">
          <FieldLabel htmlFor="otp">Código de verificación</FieldLabel>
          <InputOTP
            id="otp"
            maxLength={6}
            value={otp}
            onChange={onChange}
            aria-invalid={Boolean(error)}
            containerClassName="justify-center gap-2"
          >
            <InputOTPGroup className="gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="size-11 rounded-lg border bg-muted text-base font-bold"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <FieldDescription>Código de prueba: 123456</FieldDescription>
          <FieldError>{error}</FieldError>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <Button type="button" className="min-h-12 text-base font-bold" onClick={onSubmit}>
          Siguiente
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-12 border-primary text-primary hover:bg-primary/10"
          disabled={timer > 0}
          onClick={onResend}
        >
          {timer > 0 ? `Reenviar código en ${timer}s` : "Reenviar código"}
        </Button>
      </div>
    </div>
  );
}

function ProfileInfoScreen({
  profile,
  errors,
  onChange,
  onSubmit,
}: {
  profile: { name: string; lastName: string; dni: string };
  errors: Record<string, string>;
  onChange: (profile: { name: string; lastName: string; dni: string }) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-brand">Información de perfil</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Completa tus datos para identificarte en caso de emergencia.
        </p>
      </section>

      <Card className="rounded-lg border-rose-border">
        <CardContent className="pt-6">
          <FieldGroup>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="name">Nombre</FieldLabel>
              <Input
                id="name"
                autoComplete="given-name"
                placeholder="Ej. Juan"
                value={profile.name}
                aria-invalid={Boolean(errors.name)}
                className="min-h-12 bg-muted text-base"
                onChange={(event) => onChange({ ...profile, name: event.target.value })}
              />
              <FieldError>{errors.name}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.lastName)}>
              <FieldLabel htmlFor="lastName">Apellido</FieldLabel>
              <Input
                id="lastName"
                autoComplete="family-name"
                placeholder="Ej. Pérez"
                value={profile.lastName}
                aria-invalid={Boolean(errors.lastName)}
                className="min-h-12 bg-muted text-base"
                onChange={(event) => onChange({ ...profile, lastName: event.target.value })}
              />
              <FieldError>{errors.lastName}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.dni)}>
              <FieldLabel htmlFor="dni">DNI</FieldLabel>
              <Input
                id="dni"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Ej. 12345678"
                value={profile.dni}
                maxLength={8}
                aria-invalid={Boolean(errors.dni)}
                className="min-h-12 bg-muted text-base"
                onChange={(event) =>
                  onChange({
                    ...profile,
                    dni: event.target.value.replace(/\D/g, "").slice(0, 8),
                  })
                }
              />
              <FieldError>{errors.dni}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-card p-4 text-sm leading-6 text-brand">
        <div className="mb-1 flex items-center gap-2 font-bold">
          <IdCard className="size-4" aria-hidden="true" />
          Verificación obligatoria
        </div>
        Tus datos serán validados para garantizar la legitimidad de los reportes.
      </div>

      <Button type="button" className="mt-auto min-h-12 text-base font-bold" onClick={onSubmit}>
        Siguiente
        <ArrowRight data-icon="inline-end" aria-hidden="true" />
      </Button>
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <section className="flex flex-col items-center gap-5 text-center">
        <div className="grid size-24 place-items-center rounded-full bg-white text-primary shadow-[0_18px_50px_rgba(0,0,0,0.1)]">
          <ShieldCheck className="size-12" strokeWidth={2.4} aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold text-brand">Te damos la bienvenida a AlertaBombero</h1>
          <p className="mx-auto max-w-[20rem] text-sm leading-6 text-muted-foreground">
            Garantizamos tu seguridad en todo momento con una respuesta rápida y efectiva.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3" aria-label="Beneficios de bienvenida">
        <FeatureMini icon={Clock3} title="Respuesta Rápida" description="Conexión directa e inmediata." />
        <FeatureMini icon={LocateFixed} title="Ubicación Precisa" description="Referencia clara para atenderte." />
      </section>

      <Button type="button" className="min-h-12 text-base font-bold" onClick={onStart}>
        Empezar
        <ArrowRight data-icon="inline-end" aria-hidden="true" />
      </Button>
    </div>
  );
}

function HomeScreen({ fullName, onReport }: { fullName: string; onReport: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <section className="rounded-lg bg-primary p-4 text-primary-foreground">
        <p className="text-xs font-semibold opacity-85">Bienvenido,</p>
        <h1 className="text-xl font-extrabold">{fullName}</h1>
      </section>

      <div className="flex items-center gap-2 rounded-lg border border-rose-border bg-card p-3 text-sm font-semibold text-foreground">
        <MapPin className="size-4 text-primary" aria-hidden="true" />
        Av. Luis Gonzales
      </div>

      <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 text-center">
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.45rem] font-extrabold leading-tight text-foreground">¿Necesitas ayuda de emergencia?</h2>
          <p className="mx-auto max-w-[19rem] text-sm leading-5 text-muted-foreground">
            Presiona el botón para alertar a la central de emergencia más cercana.
          </p>
        </div>

        <button
          type="button"
          aria-label="Reportar emergencia"
          className="relative grid size-[13.5rem] place-items-center rounded-full bg-transparent text-primary outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98]"
          onClick={onReport}
        >
          <span className="absolute inset-0 rounded-full border border-primary/25" aria-hidden="true" />
          <span className="absolute inset-3 rounded-full border border-primary/25" aria-hidden="true" />
          <span className="absolute inset-6 rounded-full border border-primary/20" aria-hidden="true" />
          <span className="z-10 grid size-40 place-items-center rounded-full bg-primary text-primary-foreground">
            <span className="flex flex-col items-center gap-3 text-center">
              <Flame className="size-11" strokeWidth={2.4} aria-hidden="true" />
              <span className="flex flex-col gap-1 text-lg font-extrabold uppercase leading-tight tracking-wide">
                <span>Reportar</span>
                <span>Emergencia</span>
              </span>
            </span>
          </span>
        </button>
      </section>

      <p className="text-center text-xs font-medium leading-5 text-muted-foreground">
        Tu ubicación se adjuntará al reporte para acelerar la atención.
      </p>
    </div>
  );
}

function ReportScreen({
  report,
  evidence,
  errors,
  onChange,
  onAddEvidence,
  onRemoveEvidence,
  onSubmit,
}: {
  report: ReportDraft;
  evidence: EvidenceItem[];
  errors: Record<string, string>;
  onChange: (report: ReportDraft) => void;
  onAddEvidence: (files: FileList | null, kind: EvidenceItem["kind"]) => void;
  onRemoveEvidence: (id: string) => void;
  onSubmit: () => void;
}) {
  const [isEvidenceChooserOpen, setIsEvidenceChooserOpen] = useState(false);

  function handleEvidence(files: FileList | null, kind: EvidenceItem["kind"]) {
    onAddEvidence(files, kind);
    setIsEvidenceChooserOpen(false);
  }

  return (
    <div className="flex flex-1 flex-col gap-5 pb-4">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-brand">Enviar reporte</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Completa la información mínima para enviar la alerta.
        </p>
      </section>

      <Card className="rounded-lg border-rose-border">
        <CardContent className="pt-6">
          <FieldGroup>
            <Field data-invalid={Boolean(errors.location)}>
              <FieldLabel htmlFor="location">Ubicación</FieldLabel>
              <div className="relative">
                <Input
                  id="location"
                  value={report.location}
                  aria-invalid={Boolean(errors.location)}
                  className="min-h-12 bg-muted pr-11 text-base"
                  onChange={(event) => onChange({ ...report, location: event.target.value })}
                />
                <MapPin
                  className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-primary"
                  aria-hidden="true"
                />
              </div>
              <FieldError>{errors.location}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="type">Tipo de emergencia</FieldLabel>
              <select
                id="type"
                value={report.type}
                className="min-h-12 w-full rounded-lg border border-input bg-muted px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                onChange={(event) =>
                  onChange({ ...report, type: event.currentTarget.value as ReportDraft["type"] })
                }
              >
                {emergencyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Descripción opcional</FieldLabel>
              <Textarea
                id="description"
                placeholder="Describe la emergencia..."
                value={report.description}
                className="min-h-24 resize-none bg-muted text-base"
                onChange={(event) => onChange({ ...report, description: event.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel>Evidencia</FieldLabel>
              <button
                type="button"
                className="flex min-h-32 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-primary/35 bg-primary/5 p-4 text-center text-sm font-semibold text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-haspopup="dialog"
                aria-expanded={isEvidenceChooserOpen}
                onClick={() => setIsEvidenceChooserOpen(true)}
              >
                <span className="grid size-12 place-items-center rounded-full bg-primary/12">
                  <Upload className="size-6" aria-hidden="true" />
                </span>
                {evidence.length > 0
                  ? `${evidence.length} evidencia${evidence.length === 1 ? "" : "s"} adjunta${evidence.length === 1 ? "" : "s"}`
                  : "Toca para capturar o subir una imagen o video"}
              </button>
              {evidence.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2" aria-label="Evidencia adjunta">
                  {evidence.map((item) => (
                    <li
                      key={item.id}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-rose-border bg-muted px-3 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <FileImage className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        <span className="truncate">
                          {item.kind}: {item.name}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
                        aria-label={`Quitar ${item.name}`}
                        onClick={() => onRemoveEvidence(item.id)}
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {isEvidenceChooserOpen ? (
                <EvidenceChooser
                  onClose={() => setIsEvidenceChooserOpen(false)}
                  onCamera={(files) => handleEvidence(files, "foto")}
                  onGallery={(files) => handleEvidence(files, "archivo")}
                />
              ) : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            className="min-h-12 w-full text-base font-bold"
            onClick={onSubmit}
          >
            Enviar reporte
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function SendingScreen({
  countdown,
  progress,
  onCancel,
}: {
  countdown: number;
  progress: number;
  onCancel: () => void;
}) {
  return (
    <div className="flex min-h-svh flex-col justify-center gap-8 bg-primary px-5 py-8 text-center text-primary-foreground">
      <div className="mx-auto flex w-fit items-center gap-2 rounded-lg bg-brand px-3 py-1 text-xs font-bold">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        Conexión segura
      </div>

      <section className="flex flex-col items-center gap-6">
        <div className="relative grid size-44 place-items-center rounded-full border border-white/35">
          <span className="absolute inset-5 rounded-full border border-white/30" aria-hidden="true" />
          <span className="grid size-28 place-items-center rounded-full bg-white text-6xl font-extrabold text-primary">
            {countdown}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-extrabold">Enviando reporte...</h1>
          <p className="mx-auto max-w-[18rem] text-sm leading-6 text-white/86">
            Estamos procesando tu solicitud de emergencia. Por favor, no cierres la app.
          </p>
        </div>
      </section>

      <Progress value={progress} className="h-2 bg-white/25" />

      <Button
        type="button"
        variant="outline"
        className="mt-6 min-h-12 border-white bg-white text-brand hover:bg-white/90"
        onClick={onCancel}
      >
        Cancelar reporte
      </Button>
    </div>
  );
}

function MapScreen({ report }: { report: ReportDraft }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <section className="flex items-start justify-between gap-3 rounded-lg bg-primary p-4 text-primary-foreground">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold opacity-85">Reporte enviado</p>
          <h1 className="text-xl font-extrabold">{report.type}</h1>
          <p className="text-sm opacity-90">{report.location}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-brand">
          Recibido
        </span>
      </section>

      <section
        aria-label="Mapa del reporte"
        className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-rose-border bg-[#263238]"
      >
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="absolute left-8 top-12 h-[22rem] w-14 rotate-[32deg] rounded-full bg-primary/55 blur-sm" />
        <div className="absolute right-10 top-8 h-[24rem] w-12 -rotate-[24deg] rounded-full bg-primary/35 blur-sm" />
        <div className="absolute bottom-20 left-10 h-28 w-28 rounded-full border border-primary bg-primary/15" />
        <div className="absolute bottom-32 left-24 grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <Flame className="size-6" aria-hidden="true" />
        </div>
        <div className="absolute right-5 top-5 rounded-lg bg-white p-3 text-left shadow-lg">
          <p className="text-xs font-bold uppercase text-primary">Emergencia</p>
          <p className="mt-1 text-sm font-bold text-foreground">{report.type}</p>
          <p className="text-xs text-muted-foreground">Estación cercana asignada</p>
        </div>
        <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-extrabold text-brand">Alerta recibida</p>
              <p className="text-xs leading-5 text-muted-foreground">
                La estación asignada ya recibió tu ubicación.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReportsScreen({ onReport }: { onReport: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-brand">Reportes</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Consulta tus alertas enviadas desde este dispositivo.
        </p>
      </section>

      <Card className="rounded-lg border-rose-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>No tienes reportes activos</CardTitle>
          </div>
          <CardDescription>Cuando envíes una emergencia, podrás revisar aquí su estado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4 text-sm leading-6 text-muted-foreground">
            Mantén tus datos actualizados para que la atención sea más rápida.
          </div>
        </CardContent>
        <CardFooter>
          <Button type="button" className="min-h-12 w-full font-bold" onClick={onReport}>
            Reportar emergencia
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function ProfileScreen({
  fullName,
  phone,
  onSettings,
}: {
  fullName: string;
  phone: string;
  onSettings: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="flex flex-col items-center gap-3 text-center">
        <div className="relative grid size-24 place-items-center rounded-full bg-primary/10 text-primary">
          <User className="size-12" aria-hidden="true" />
          <span className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-brand">{fullName}</h1>
          <p className="text-sm text-muted-foreground">Ciudadano</p>
        </div>
      </section>

      <Card className="rounded-lg border-rose-border">
        <CardHeader>
          <CardTitle>Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-4 pb-4">
          <ProfileRow icon={Phone} label="Teléfono" value={phone || "+51 999 999 999"} />
          <ProfileRow icon={Users} label="Contactos de emergencia" value="1 contacto" />
          <ProfileRow
            icon={Settings}
            label="Configuración"
            value=""
            onClick={onSettings}
          />
        </CardContent>
      </Card>
    </div>
  );
}
function SettingsScreen({ onAccessibility }: { onAccessibility: () => void }) {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-brand">Configuración</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Ajusta opciones de uso para que la app sea más cómoda.
        </p>
      </section>

      <Card className="rounded-lg border-rose-border">
        <CardContent className="pt-4">
          <button
            type="button"
            className="flex min-h-16 w-full items-center justify-between gap-3 rounded-lg bg-muted px-4 text-left outline-none transition-colors hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={onAccessibility}
          >
            <span className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <Accessibility className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-base font-extrabold text-brand">Accesibilidad</span>
                <span className="text-sm text-muted-foreground">Lectura, contraste y movimiento</span>
              </span>
            </span>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

function AccessibilityScreen({
  settings,
  onChange,
}: {
  settings: AccessibilitySettings;
  onChange: (settings: AccessibilitySettings) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 pb-8">
      <section className="rounded-lg bg-primary p-4 text-white">
        <div className="flex items-center gap-3">
          <Accessibility className="size-7" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-extrabold">Menú de accesibilidad</h1>
            <p className="mt-1 text-sm text-white/80">Personaliza lectura, contraste y movimiento.</p>
          </div>
        </div>
      </section>

      <AccessibilityAccordion title="Pantalla y texto" description="Ajusta el tamaño y peso del texto.">
        <SliderControl
          icon={Type}
          label="Tamaño de texto"
          description="Aumenta o reduce la escala de lectura de la app."
          min={0.9}
          max={1.25}
          step={0.05}
          value={settings.textScale}
          valueLabel={`${Math.round(settings.textScale * 100)}%`}
          onChange={(textScale) => onChange({ ...settings, textScale })}
        />
        <SwitchControl
          icon={Type}
          label="Texto en negrita"
          description="Refuerza etiquetas, botones y contenido importante."
          checked={settings.boldText}
          onChange={(boldText) => onChange({ ...settings, boldText })}
        />
        <SwitchControl
          icon={ShieldCheck}
          label="Objetivos táctiles grandes"
          description="Aumenta el área mínima de botones y filas tocables."
          checked={settings.largerTouchTargets}
          onChange={(largerTouchTargets) => onChange({ ...settings, largerTouchTargets })}
        />
      </AccessibilityAccordion>

      <AccessibilityAccordion title="Color y contraste" description="Mejora legibilidad sin depender sólo del color.">
        <SwitchControl
          icon={Contrast}
          label="Alto contraste"
          description="Acentúa texto, bordes y controles principales."
          checked={settings.highContrast}
          onChange={(highContrast) => onChange({ ...settings, highContrast })}
        />
        <SwitchControl
          icon={Rows3}
          label="Reducir transparencias"
          description="Usa superficies sólidas para separar mejor los planos."
          checked={settings.reduceTransparency}
          onChange={(reduceTransparency) => onChange({ ...settings, reduceTransparency })}
        />
        <SegmentedControl
          icon={Contrast}
          label="Filtro de color"
          description="Simula filtros comunes para baja visión o daltonismo."
          value={settings.colorFilter}
          options={[
            { value: "none", label: "Sin filtro" },
            { value: "grayscale", label: "Grises" },
            { value: "protanopia", label: "Rojo" },
            { value: "deuteranopia", label: "Verde" },
            { value: "tritanopia", label: "Azul" },
          ]}
          onChange={(colorFilter) => onChange({ ...settings, colorFilter })}
        />
      </AccessibilityAccordion>

      <AccessibilityAccordion title="Lectura y enfoque" description="Ayudas para seguir líneas y reducir distracciones.">
        <SwitchControl
          icon={Rows3}
          label="Máscara de lectura"
          description="Oscurece zonas fuera de una banda central de lectura."
          checked={settings.readingMask}
          onChange={(readingMask) => onChange({ ...settings, readingMask })}
        />
        <SwitchControl
          icon={Type}
          label="Fuente amigable para dislexia"
          description="Usa una tipografía simple y espaciado más amplio."
          checked={settings.dyslexiaFont}
          onChange={(dyslexiaFont) => onChange({ ...settings, dyslexiaFont })}
        />
        <SliderControl
          icon={Rows3}
          label="Interlineado"
          description="Separa las líneas para mejorar seguimiento visual."
          min={1}
          max={1.5}
          step={0.1}
          value={settings.lineSpacing}
          valueLabel={`${Math.round(settings.lineSpacing * 100)}%`}
          onChange={(lineSpacing) => onChange({ ...settings, lineSpacing })}
        />
      </AccessibilityAccordion>

      <AccessibilityAccordion title="Movimiento" description="Reduce animaciones cuando pueden distraer o marear.">
        <SwitchControl
          icon={Accessibility}
          label="Reducir movimiento"
          description="Desactiva transiciones y efectos no esenciales."
          checked={settings.reduceMotion}
          onChange={(reduceMotion) => onChange({ ...settings, reduceMotion })}
        />
      </AccessibilityAccordion>

    </div>
  );
}
function BottomNav({
  active,
  onNavigate,
}: {
  active: Step;
  onNavigate: (step: Step) => void;
}) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-4 border-t border-border bg-background/96 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_34px_rgba(0,0,0,0.08)] backdrop-blur"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;

        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold text-muted-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive && "bg-primary/10 text-primary"
            )}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
            onClick={() => onNavigate(item.id)}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function EvidenceChooser({
  onClose,
  onCamera,
  onGallery,
}: {
  onClose: () => void;
  onCamera: (files: FileList | null) => void;
  onGallery: (files: FileList | null) => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-title"
      className="fixed inset-0 z-40 flex items-end bg-brand/35 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      onClick={onClose}
    >
      <div
        className="mx-auto flex w-full max-w-[398px] flex-col gap-4 rounded-lg bg-background p-4 shadow-[0_20px_60px_rgba(45,11,18,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="evidence-title" className="text-lg font-extrabold text-brand">
              Adjuntar evidencia
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Elige cámara para capturar ahora o galería para subir una foto o video.
            </p>
          </div>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-rose-border bg-primary/5 p-3 text-center text-sm font-bold text-primary outline-none hover:bg-primary/10 focus-within:ring-3 focus-within:ring-ring/50">
            <Camera className="size-7" aria-hidden="true" />
            Cámara
            <span className="text-xs font-medium text-muted-foreground">Foto o video</span>
            <input
              type="file"
              accept="image/*,video/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => {
                onCamera(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
            />
          </label>

          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-rose-border bg-primary/5 p-3 text-center text-sm font-bold text-primary outline-none hover:bg-primary/10 focus-within:ring-3 focus-within:ring-ring/50">
            <ImagePlus className="size-7" aria-hidden="true" />
            Galería
            <span className="text-xs font-medium text-muted-foreground">Foto o video</span>
            <input
              type="file"
              accept="image/*,video/*"
              className="sr-only"
              onChange={(event) => {
                onGallery(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function AccessibilityAccordion({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-border bg-card" open={defaultOpen}>
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <span>
          <h2 className="text-base font-extrabold text-brand">{title}</h2>
          <span className="text-xs leading-5 text-muted-foreground">{description}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden="true" />
      </summary>
      <div className="border-t border-border px-3 py-2">{children}</div>
    </details>
  );
}

function SwitchControl({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-20 items-center gap-3 border-b border-border py-3 last:border-b-0">
      <ControlIcon icon={Icon} />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-extrabold text-foreground">{label}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        className={cn(
          "flex h-8 w-14 shrink-0 items-center rounded-full border border-border p-1 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
          checked ? "bg-primary" : "bg-muted"
        )}
        onClick={() => onChange(!checked)}
      >
        <span
          className={cn(
            "size-6 rounded-full bg-background shadow-sm transition-transform",
            checked && "translate-x-6"
          )}
        />
      </button>
    </div>
  );
}

function SliderControl({
  icon: Icon,
  label,
  description,
  min,
  max,
  step,
  value,
  valueLabel,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  value: number;
  valueLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex min-h-24 gap-3 border-b border-border py-3 last:border-b-0">
      <ControlIcon icon={Icon} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-foreground">{label}</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
          <span className="rounded-md bg-muted px-2 py-1 text-xs font-extrabold text-brand">{valueLabel}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          className="mt-4 h-8 w-full accent-primary"
          onChange={(event) => onChange(Number(event.currentTarget.value))}
        />
      </div>
    </div>
  );
}

function SegmentedControl<TValue extends string>({
  icon: Icon,
  label,
  description,
  value,
  options,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  value: TValue;
  options: Array<{ value: TValue; label: string }>;
  onChange: (value: TValue) => void;
}) {
  return (
    <div className="flex min-h-28 gap-3 border-b border-border py-3 last:border-b-0">
      <ControlIcon icon={Icon} />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-extrabold text-foreground">{label}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "min-h-11 rounded-lg border border-border px-2 text-xs font-bold text-muted-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                value === option.value && "border-primary bg-primary text-primary-foreground"
              )}
              aria-pressed={value === option.value}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ControlIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
      <Icon className="size-5" aria-hidden="true" />
    </span>
  );
}

function ReadingMask() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[34svh] z-50 mx-auto h-28 max-w-[430px] border-y border-brand/40 shadow-[0_0_0_9999px_rgba(45,11,18,0.18)]"
      aria-hidden="true"
    />
  );
}
function FeatureMini({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-rose-border bg-card p-3">
      <Icon className="mb-2 size-5 text-primary" aria-hidden="true" />
      <h2 className="text-sm font-extrabold text-brand">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-2 text-[13px] font-semibold sm:text-sm">
        <Icon className="size-3.5 text-primary sm:size-4" aria-hidden="true" />
        <span className="whitespace-nowrap">{label}</span>
      </div>
      <span className="flex shrink-0 items-center gap-2 text-[13px] text-muted-foreground sm:text-sm">
        {value ? <span>{value}</span> : null}
        {onClick ? <ChevronRight className="size-4" aria-hidden="true" /> : null}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg bg-muted px-3 text-left outline-none transition-colors hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg bg-muted px-3">
      {content}
    </div>
  );
}
