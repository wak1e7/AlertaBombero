import type React from "react";
import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  ClipboardList,
  History,
  Home,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { AiIcon } from "./components/AiIcon";
import { AppShell } from "./components/AppShell";
import { AuthCard } from "./components/AuthCard";
import { BrandLogo } from "./components/BrandLogo";
import { EmergencyButton } from "./components/EmergencyButton";
import { StatusBadge } from "./components/StatusBadge";
import accessHeroBackground from "./assets/access-hero-background-ai.png";
import { DEMO_OTP_CODE, verifySimulatedOtp } from "./domain/otp";
import { getAuthMode } from "./lib/env";
import { getSupabaseClient } from "./lib/supabase";
const CitizenProfileScreen = lazy(() => import("./screens/CitizenProfileScreen").then(({ CitizenProfileScreen }) => ({ default: CitizenProfileScreen })));
const CitizenHistoryScreen = lazy(() => import("./screens/CitizenHistoryScreen").then(({ CitizenHistoryScreen }) => ({ default: CitizenHistoryScreen })));
const CitizenReportScreen = lazy(() => import("./screens/CitizenReportScreen").then(({ CitizenReportScreen }) => ({ default: CitizenReportScreen })));
const CitizenTrackingScreen = lazy(() => import("./screens/CitizenTrackingScreen").then(({ CitizenTrackingScreen }) => ({ default: CitizenTrackingScreen })));
const FirefighterProfileScreen = lazy(() => import("./screens/FirefighterProfileScreen").then(({ FirefighterProfileScreen }) => ({ default: FirefighterProfileScreen })));
const FirefighterHistoryScreen = lazy(() => import("./screens/FirefighterHistoryScreen").then(({ FirefighterHistoryScreen }) => ({ default: FirefighterHistoryScreen })));
const FirefighterReportDetailScreen = lazy(() => import("./screens/FirefighterReportDetailScreen").then(({ FirefighterReportDetailScreen }) => ({ default: FirefighterReportDetailScreen })));
const FirefighterReportsScreen = lazy(() => import("./screens/FirefighterReportsScreen").then(({ FirefighterReportsScreen }) => ({ default: FirefighterReportsScreen })));
const AccessibilitySettingsScreen = lazy(() => import("./screens/AccessibilitySettingsScreen").then(({ AccessibilitySettingsScreen }) => ({ default: AccessibilitySettingsScreen })));
import { loadAccessibilitySettings } from "./services/accessibility";
import { createAuthService } from "./services/authService";
import {
  clearActiveSessionId,
  clearPendingAuth,
  createActiveSessionId,
  getActiveSessionId,
  getPendingAuth,
  saveActiveSessionId,
  savePendingAuth
} from "./services/session";

function authService() {
  return createAuthService(getSupabaseClient(), { authMode: getAuthMode() });
}

function isDemoAuth() {
  return getAuthMode() === "demo";
}

export function App() {
  const [accessibility, setAccessibility] = useState(loadAccessibilitySettings);

  useEffect(() => {
    const refresh = () => setAccessibility(loadAccessibilitySettings());
    window.addEventListener("alertabombero:accessibility", refresh);
    return () => window.removeEventListener("alertabombero:accessibility", refresh);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * accessibility.textScale}px`;
    return () => { document.documentElement.style.fontSize = ""; };
  }, [accessibility.textScale]);

  return (
    <div className="accessibility-shell" data-bold-text={accessibility.boldText} data-color-filter={accessibility.colorFilter} data-dyslexia-font={accessibility.dyslexiaFont} data-high-contrast={accessibility.highContrast} data-large-targets={accessibility.largerTouchTargets} data-reduce-motion={accessibility.reduceMotion} data-reduce-transparency={accessibility.reduceTransparency} style={{ "--accessibility-line-spacing": accessibility.lineSpacing } as React.CSSProperties}>
      {accessibility.readingMask ? <div className="reading-mask" aria-hidden="true" /> : null}
    <BrowserRouter>
      <Suspense fallback={<ScreenLoader />}>
      <Routes>
        <Route path="/" element={<RoleAccessScreen />} />
        <Route path="/ciudadano/login" element={<CitizenLoginScreen />} />
        <Route path="/ciudadano/registro" element={<CitizenRegisterScreen />} />
        <Route path="/ciudadano/otp" element={<OtpScreen expectedRole="citizen" />} />
        <Route path="/ciudadano/bienvenida" element={<WelcomeScreen role="citizen" />} />
        <Route
          path="/ciudadano/inicio"
          element={
            <ProtectedRoute role="citizen" loginPath="/ciudadano/login">
              <CitizenHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ciudadano/reporte"
          element={
            <ProtectedRoute role="citizen" loginPath="/ciudadano/login">
              <CitizenReportScreen />
            </ProtectedRoute>
          }
        />
        <Route path="/ciudadano/reporte/evidencia" element={<Navigate to="/ciudadano/reporte" replace />} />
        <Route path="/ciudadano/reporte/resumen" element={<Navigate to="/ciudadano/reporte" replace />} />
        <Route
          path="/ciudadano/seguimiento/:id"
          element={
            <ProtectedRoute role="citizen" loginPath="/ciudadano/login">
              <CitizenTrackingScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ciudadano/historial"
          element={
            <ProtectedRoute role="citizen" loginPath="/ciudadano/login">
              <CitizenHistoryScreen navItems={citizenNavItems} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ciudadano/perfil"
          element={
            <ProtectedRoute role="citizen" loginPath="/ciudadano/login">
              <CitizenProfileScreen navItems={citizenNavItems} />
            </ProtectedRoute>
          }
        />
        <Route path="/ciudadano/configuracion" element={<ProtectedRoute role="citizen" loginPath="/ciudadano/login"><AccessibilitySettingsScreen backTo="/ciudadano/perfil" navItems={citizenNavItems} /></ProtectedRoute>} />
        <Route path="/bombero/login" element={<FirefighterLoginScreen />} />
        <Route path="/bombero/otp" element={<OtpScreen expectedRole="firefighter" />} />
        <Route path="/bombero/bienvenida" element={<WelcomeScreen role="firefighter" />} />
        <Route
          path="/bombero/inicio"
          element={
            <ProtectedRoute role="firefighter" loginPath="/bombero/login">
              <FirefighterHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bombero/reportes"
          element={
            <ProtectedRoute role="firefighter" loginPath="/bombero/login">
              <FirefighterReportsScreen navItems={firefighterNavItems} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bombero/reportes/:id"
          element={
            <ProtectedRoute role="firefighter" loginPath="/bombero/login">
              <FirefighterReportDetailScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bombero/historial"
          element={
            <ProtectedRoute role="firefighter" loginPath="/bombero/login">
              <FirefighterHistoryScreen navItems={firefighterNavItems} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bombero/perfil"
          element={
            <ProtectedRoute role="firefighter" loginPath="/bombero/login">
              <FirefighterProfileScreen navItems={firefighterNavItems} />
            </ProtectedRoute>
          }
        />
        <Route path="/bombero/configuracion" element={<ProtectedRoute role="firefighter" loginPath="/bombero/login"><AccessibilitySettingsScreen backTo="/bombero/perfil" navItems={firefighterNavItems} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
    </div>
  );
}

function ScreenLoader() {
  return (
    <AppShell compact>
      <div className="grid min-h-dvh place-items-center bg-app px-6 text-center">
        <div>
          <span className="mx-auto block h-10 w-10 animate-pulse rounded-full border-4 border-emergency-100 border-t-emergency-600" aria-hidden="true" />
          <p className="mt-4 text-sm font-bold text-muted">Cargando pantalla segura...</p>
        </div>
      </div>
    </AppShell>
  );
}

function RoleAccessScreen() {
  return (
    <AppShell compact>
      <section
        className="mobile-static-screen relative isolate h-dvh overflow-hidden bg-white px-5 pb-5 pt-5 sm:px-7"
        style={{ backgroundImage: `url(${accessHeroBackground})`, backgroundPosition: "center bottom", backgroundRepeat: "no-repeat", backgroundSize: "100% auto" }}
      >
        <div className="mobile-access-content relative mx-auto flex h-full max-w-sm flex-col items-center">
          <header className="mobile-access-header pt-1 text-center">
            <div className="mx-auto w-fit"><BrandLogo large /></div>
            <h1 className="mt-4 text-[2.35rem] font-black leading-none tracking-[-0.045em] text-emergency-700">AlertaBombero</h1>
            <p className="mt-3 text-base font-medium tracking-[-0.01em] text-slate-500">Reporta emergencias en tiempo real</p>
            <div className="mx-auto mt-7 flex w-28 items-center justify-center gap-2" aria-hidden="true"><span className="h-0.5 w-9 bg-emergency-600" /><span className="h-2.5 w-2.5 rounded-full bg-emergency-600" /><span className="h-0.5 w-9 bg-emergency-600" /></div>
          </header>

          <div className="mobile-access-choices mt-7 w-full space-y-3">
            <p className="text-center text-xl font-black tracking-[-0.02em] text-ink">Como deseas continuar?</p>
          <RoleCard
            href="/ciudadano/login"
            icon={<AiIcon name="citizens" className="h-11 w-11" />}
            title="Soy ciudadano"
            description={<>Reporta emergencias<br />y haz seguimiento</>}
          />
          <RoleCard
            href="/bombero/login"
            icon={<AiIcon name="firefighter" className="h-12 w-12" />}
            title="Soy bombero"
            description={<>Accede al panel operativo<br />y atiende emergencias</>}
            featured
          />
          </div>

          <div className="mobile-access-trust mt-5 grid w-full grid-cols-2 gap-3">
            <TrustCard icon={<AiIcon name="secure" className="h-9 w-9" />} title="Datos seguros" description="Tu informacion esta protegida y encriptada." />
            <TrustCard icon={<AiIcon name="rapid" className="h-9 w-9" />} title="Respuesta rapida" description="Conexion directa con bomberos y estaciones." />
          </div>

          <footer className="mobile-access-footer mt-auto w-full pt-5 text-center">
            <div className="flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-slate-300" /><span className="grid h-9 w-9 place-items-center rounded-full border-2 border-emergency-600 bg-white text-emergency-600"><ShieldCheck className="h-4 w-4" /></span><span className="h-px flex-1 bg-slate-300" /></div>
            <p className="mt-5 text-sm font-medium text-slate-500">Juntos protegemos vidas y nuestra comunidad.</p>
            <p className="mt-3 text-sm font-bold text-emergency-700">Ante una emergencia, actua con calma y seguridad.</p>
          </footer>
        </div>
      </section>
    </AppShell>
  );
}

function RoleCard({
  href,
  icon,
  title,
  description,
  featured = false
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  featured?: boolean;
}) {
  return (
    <Link
      to={href}
      className={`flex min-h-32 items-center gap-4 rounded-[1.35rem] border p-4.5 text-left shadow-[0_12px_28px_rgba(31,38,51,0.09)] transition duration-150 active:scale-[0.99] ${
        featured
          ? "border-emergency-600 bg-[linear-gradient(125deg,#d90f0c_0%,#ee1a16_70%,#c90e0b_100%)] text-white"
          : "border-emergency-200 bg-white/95 text-ink hover:bg-emergency-50"
      }`}
    >
      <span
        className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${
          featured ? "bg-white text-emergency-600" : "bg-emergency-50 text-emergency-600"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block whitespace-nowrap text-[1.4rem] font-black leading-none tracking-[-0.035em] sm:text-[1.55rem]">{title}</span>
        <span className={`mt-2.5 block text-sm leading-snug sm:text-base ${featured ? "text-white/95" : "text-slate-500"}`}>
          {description}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="h-8 w-8 shrink-0 stroke-[2.5]" />
    </Link>
  );
}

function TrustCard({ description, icon, title }: { description: string; icon: React.ReactNode; title: string }) {
  return (
    <article className="min-h-36 rounded-[1.15rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_5px_16px_rgba(31,38,51,0.04)]">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-emergency-50 text-emergency-600">{icon}</span>
      <h2 className="mt-3 text-sm font-black tracking-[-0.02em] text-ink">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
    </article>
  );
}

function CitizenLoginScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authService().loginCitizen(form);
      if (result.nextStep === "welcome") {
        const sessionId = createActiveSessionId();
        await authService().resumeVerifiedSession(result.profileId, sessionId);
        saveActiveSessionId(sessionId);
        navigate(result.welcomePath);
        return;
      }
      savePendingAuth({
        expiresAt: result.otp!.expiresAt,
        profileId: result.profileId,
        purpose: result.otp!.purpose,
        role: result.role,
        userIdentifier: result.otp!.userIdentifier,
        welcomePath: result.welcomePath
      });
      navigate("/ciudadano/otp");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell compact>
      <AuthCard title="Iniciar sesion" subtitle="Accede a tu cuenta ciudadana" backTo="/">
        <form className="space-y-4" onSubmit={onSubmit}>
          <TextInput
            label="Telefono"
            value={form.phone}
            onChange={(phone) => setForm((current) => ({ ...current, phone }))}
            placeholder="+51 999 999 999"
          />
          <TextInput
            label="Contrasena"
            type="password"
            value={form.password}
            onChange={(password) => setForm((current) => ({ ...current, password }))}
            placeholder="Ingresa tu contrasena"
          />
          <FormError message={error} />
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          <p className="text-center text-xs text-muted">
            No tienes cuenta?{" "}
            <Link className="font-bold text-emergency-600" to="/ciudadano/registro">
              Crear cuenta
            </Link>
          </p>
        </form>
      </AuthCard>
    </AppShell>
  );
}

function CitizenRegisterScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", lastName: "", phone: "", dni: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authService().registerCitizen(form);
      savePendingAuth({
        expiresAt: result.otp.expiresAt,
        profileId: result.profileId,
        purpose: result.otp.purpose,
        role: result.role,
        userIdentifier: result.otp.userIdentifier,
        welcomePath: result.welcomePath
      });
      navigate("/ciudadano/otp");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell compact>
      <AuthCard title="Crear cuenta" subtitle="Registro ciudadano seguro" backTo="/ciudadano/login" scrollable>
        <form className="space-y-3" onSubmit={onSubmit}>
          <TextInput label="Nombres" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} />
          <TextInput
            label="Apellidos"
            value={form.lastName}
            onChange={(lastName) => setForm((current) => ({ ...current, lastName }))}
          />
          <TextInput
            label="Telefono"
            value={form.phone}
            onChange={(phone) => setForm((current) => ({ ...current, phone }))}
            placeholder="+51 999 999 999"
          />
          <TextInput label="DNI" value={form.dni} onChange={(dni) => setForm((current) => ({ ...current, dni }))} />
          <TextInput
            label="Contrasena"
            type="password"
            value={form.password}
            onChange={(password) => setForm((current) => ({ ...current, password }))}
          />
          <FormError message={error} />
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? "Creando..." : "Continuar"}
          </button>
        </form>
      </AuthCard>
    </AppShell>
  );
}

function FirefighterLoginScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firefighterCode: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authService().loginFirefighter(form);
      if (result.nextStep === "welcome") {
        const sessionId = createActiveSessionId();
        await authService().resumeVerifiedSession(result.profileId, sessionId);
        saveActiveSessionId(sessionId);
        navigate(result.welcomePath);
        return;
      }
      savePendingAuth({
        expiresAt: result.otp!.expiresAt,
        profileId: result.profileId,
        purpose: result.otp!.purpose,
        role: result.role,
        userIdentifier: result.otp!.userIdentifier,
        welcomePath: result.welcomePath
      });
      navigate("/bombero/otp");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell compact>
      <AuthCard title="Acceso bombero" subtitle="Ingresa tus datos para continuar" backTo="/">
        <form className="space-y-4" onSubmit={onSubmit}>
          <TextInput
            label="Codigo de bombero"
            value={form.firefighterCode}
            onChange={(firefighterCode) => setForm((current) => ({ ...current, firefighterCode }))}
            placeholder="A24982"
          />
          <TextInput
            label="Contrasena"
            type="password"
            value={form.password}
            onChange={(password) => setForm((current) => ({ ...current, password }))}
          />
          <FormError message={error} />
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? "Validando..." : "Ingresar"}
          </button>
        </form>
      </AuthCard>
    </AppShell>
  );
}

function OtpScreen({ expectedRole }: { expectedRole: "citizen" | "firefighter" }) {
  const navigate = useNavigate();
  const pending = getPendingAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  useEffect(() => {
    if (!verificationComplete && (!pending || pending.role !== expectedRole)) {
      navigate(expectedRole === "citizen" ? "/ciudadano/login" : "/bombero/login", { replace: true });
    }
  }, [expectedRole, navigate, pending, verificationComplete]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) return;

    if (!isDemoAuth()) {
      setError("No se pudo verificar tu identidad. Intenta nuevamente.");
      return;
    }

    const verification = verifySimulatedOtp({ ...pending, code: DEMO_OTP_CODE }, code);
    if (!verification.ok) {
      setError(verification.reason === "expired" ? "El codigo expiro. Vuelve a iniciar sesion." : "Codigo incorrecto.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const sessionId = createActiveSessionId();
      await authService().markPhoneVerified(pending.profileId, sessionId);
      const { data: sessionData } = await getSupabaseClient().auth.getSession();
      if (!sessionData.session) {
        throw new Error("Tu sesion expiro. Vuelve a iniciar sesion.");
      }

      setVerificationComplete(true);
      saveActiveSessionId(sessionId);
      clearPendingAuth();
      navigate(pending.welcomePath);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell compact>
      <AuthCard title="Verificar identidad" subtitle="Ingresa el codigo de seguridad" backTo={expectedRole === "citizen" ? "/ciudadano/login" : "/bombero/login"}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emergency-50 text-emergency-600"><LockKeyhole className="h-8 w-8" /></div>
          <label className="field-label text-center">Codigo de 6 digitos
            <input aria-label="Codigo OTP" className="otp-code mt-3" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="------" value={code} />
          </label>
          <FormError message={error} />
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? "Verificando..." : "Verificar"}
          </button>
        </form>
      </AuthCard>
    </AppShell>
  );
}

function ProtectedRoute({
  children,
  loginPath,
  role
}: {
  children: React.ReactNode;
  loginPath: string;
  role: "citizen" | "firefighter";
}) {
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let alive = true;

    async function checkSession() {
      const client = getSupabaseClient();
      const { data } = await client.auth.getSession();
      const authUserId = data.session?.user.id;
      const activeSessionId = getActiveSessionId();

      if (!authUserId || !activeSessionId) {
        if (alive) setState("denied");
        return;
      }

      const { data: profile } = await client
        .from("profiles")
        .select("role, active_session_id, phone_verified")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (profile?.role === role && profile.phone_verified && profile.active_session_id === activeSessionId) {
        if (alive) setState("allowed");
      } else {
        clearActiveSessionId();
        if (alive) setState("denied");
      }
    }

    checkSession();
    window.addEventListener("focus", checkSession);

    return () => {
      alive = false;
      window.removeEventListener("focus", checkSession);
    };
  }, [role]);

  if (state === "loading") {
    return (
      <AppShell>
        <div className="grid min-h-dvh place-items-center text-sm font-semibold text-muted">Validando sesion...</div>
      </AppShell>
    );
  }

  if (state === "denied") {
    return <Navigate to={loginPath} replace />;
  }

  return children;
}

function WelcomeScreen({ role }: { role: "citizen" | "firefighter" }) {
  const href = role === "firefighter" ? "/bombero/inicio" : "/ciudadano/inicio";
  const label = role === "firefighter" ? "Ir al panel" : "Ir al inicio";

  return (
    <AppShell compact>
      <div className="welcome-screen relative grid h-dvh overflow-hidden px-5 py-5">
        <div className="my-auto text-center">
          <div className="mx-auto w-fit"><BrandLogo large /></div>
          <h1 className="mt-4 text-[1.9rem] font-black leading-tight text-ink">
            {role === "firefighter" ? <>Bienvenido,<br /><span className="text-emergency-600">bombero</span></> : <>Bienvenido a<br /><span className="text-emergency-600">AlertaBombero</span></>}
          </h1>
          <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-success"><ShieldCheck className="h-4 w-4" /> Cuenta verificada</p>
          <div className="mt-5 space-y-2 text-left">
            <WelcomeFeature icon={<AiIcon name={role === "citizen" ? "citizens" : "firefighter"} className="h-7 w-7" />} title={role === "citizen" ? "Ubicacion automatica" : "Compania asignada"} text={role === "citizen" ? "Detectamos tu ubicacion para enviar ayuda rapidamente." : "Accede a reportes asignados a tu compania."} />
            <WelcomeFeature icon={<AiIcon name={role === "citizen" ? "accident" : "siren"} className="h-7 w-7" />} title={role === "citizen" ? "Evidencia obligatoria" : "Estados operativos"} text={role === "citizen" ? "Adjunta fotos o videos para que te puedan atender." : "Actualiza el estado de cada emergencia en tiempo real."} />
          </div>
          <Link className="btn-primary mt-5" to={href}>{label}<ChevronRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </AppShell>
  );
}

function WelcomeFeature({ icon, text, title }: { icon: React.ReactNode; text: string; title: string }) {
  return <article className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-soft"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emergency-50 text-emergency-600 [&>svg]:h-4 [&>svg]:w-4">{icon}</span><span><strong className="block text-xs text-ink">{title}</strong><span className="mt-0.5 block text-[10px] leading-relaxed text-muted">{text}</span></span></article>;
}

function TextInput({
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="field-label text-left">
      {label}
      <input
        className="field-control"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function FormError({ message }: { message: string }) {
  if (!message) return null;

  return (
    <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700" role="alert">
      {message}
    </p>
  );
}

function errorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : "No se pudo completar la accion.";
}

function CitizenHome() {
  const navigate = useNavigate();

  return (
    <AppShell navItems={citizenNavItems}>
      <div className="mobile-home flex min-h-[calc(100dvh-7rem)] flex-col">
      <DashboardHeader eyebrow="Bienvenido" title="Juan Perez" />
      <section className="app-card mt-4 p-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-emergency-50 text-emergency-600"><MapPin className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-bold text-muted">Ubicacion actual</p>
            <p className="mt-0.5 text-sm font-extrabold text-ink">Chiclayo, Lambayeque</p>
          </div>
        </div>
      </section>
      <section className="my-auto pb-2 pt-6 text-center">
        <p className="text-lg font-black text-ink">Necesitas ayuda de emergencia?</p>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">Inicia un reporte rapido y agrega la informacion necesaria.</p>
        <div className="mt-7 flex justify-center">
          <EmergencyButton onClick={() => navigate("/ciudadano/reporte")} />
        </div>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-success"><ShieldCheck className="h-3.5 w-3.5" /> Listo para reportar</p>
      </section></div>
    </AppShell>
  );
}

export function FirefighterHome() {
  return (
    <AppShell navItems={firefighterNavItems}>
      <div className="mobile-home flex min-h-[calc(100dvh-7rem)] flex-col">
      <DashboardHeader eyebrow="Bienvenido" title="Carlos Ramirez" />
      <section className="app-card mt-4 p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted">Compania asignada</p>
            <p className="mt-1 text-sm font-extrabold text-ink">Cuerpo de Bomberos - Chiclayo</p>
          </div>
          <StatusBadge status="RECIBIDO" />
        </div>
      </section>
      <section className="my-auto pb-2 pt-6 text-center">
        <p className="text-lg font-black text-ink">Necesitas reportar una emergencia?</p>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">Registra una alerta operativa desde tu ubicacion actual.</p>
        <div className="mt-7 flex justify-center">
          <EmergencyButton />
        </div>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-success"><ShieldCheck className="h-3.5 w-3.5" /> Listo para reportar</p>
      </section></div>
    </AppShell>
  );
}

function DashboardHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="pt-6">
      <div className="flex items-center justify-between">
        <BrandLogo withName />
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-emergency-50 text-emergency-600"><Bell className="h-4 w-4" /></span>
      </div>
      <p className="section-kicker mt-6">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-black text-ink">{title}</h1>
    </header>
  );
}

const citizenNavItems = [
  { href: "/ciudadano/inicio", label: "Inicio", icon: Home },
  { href: "/ciudadano/historial", label: "Reportes", icon: History },
  { href: "/ciudadano/perfil", label: "Perfil", icon: UserRound }
];

const firefighterNavItems = [
  { href: "/bombero/inicio", label: "Inicio", icon: Home },
  { href: "/bombero/reportes", label: "Reportes", icon: ClipboardList },
  { href: "/bombero/perfil", label: "Perfil", icon: UserRound }
];
