import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, MapPin, Phone, RefreshCw, Send, ShieldCheck, Upload, X } from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";
import { ReportTypeIcon } from "../components/ReportTypeIcon";
import { TrackingMap } from "../components/TrackingMap";
import { AppShell } from "../components/AppShell";
import { emergencyTypes, validateReportDraft, type ReportLocation } from "../domain/report";
import { getSupabaseClient } from "../lib/supabase";
import { createEmergencyReport } from "../services/reportService";

type Step = "details" | "evidence" | "summary" | "countdown";

const fallbackLocation: ReportLocation = {
  addressText: "Ubicacion aproximada en Lima",
  latitude: -12.0464,
  longitude: -77.0428
};

export function CitizenReportScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("details");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<ReportLocation | null>(null);
  const [evidence, setEvidence] = useState<File | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const online = useOnlineStatus();

  const validation = useMemo(
    () => validateReportDraft({ description, evidence, location, type }),
    [description, evidence, location, type]
  );

  useEffect(() => {
    locate();
  }, []);

  useEffect(() => {
    if (step !== "countdown" || sending) return;

    if (countdown <= 0) {
      sendReport();
      return;
    }

    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, sending, step]);

  function locate() {
    setLocating(true);
    setError("");

    if (!navigator.geolocation) {
      setLocation(fallbackLocation);
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          addressText: "Ubicacion actual detectada",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocating(false);
      },
      () => {
        setLocation(fallbackLocation);
        setLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 8000 }
    );
  }

  async function sendReport() {
    if (!online) {
      setStep("summary");
      setError("No tienes conexion. Llama al 116 o intenta de nuevo cuando vuelva internet.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const result = await createEmergencyReport(getSupabaseClient(), {
        description,
        evidence,
        location,
        type
      });
      navigate(`/ciudadano/seguimiento/${result.reportId}`, { replace: true });
    } catch (caught) {
      setStep("summary");
      setError(caught instanceof Error ? caught.message : "No se pudo enviar el reporte.");
    } finally {
      setSending(false);
    }
  }

  function startCountdown() {
    const currentValidation = validateReportDraft({ description, evidence, location, type });
    if (!currentValidation.ok) {
      setError(currentValidation.errors[0] ?? "Completa el reporte antes de enviarlo.");
      return;
    }
    setCountdown(5);
    setError("");
    setStep("countdown");
  }

  if (!online) {
    return <OfflineEmergencyScreen onRetry={() => window.dispatchEvent(new Event("online"))} />;
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 pt-5">
        <Link aria-label="Volver al inicio" className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-ink shadow-soft" to="/ciudadano/inicio">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><BrandLogo /><div><h1 className="text-base font-black text-ink">Nueva emergencia</h1><p className="text-[10px] font-medium text-muted">Paso {step === "details" ? "1" : step === "evidence" ? "2" : "3"} de 3</p></div></div>
        </div>
      </header>

      <div className="mt-5 flex gap-1.5">
        {["details", "evidence", "summary"].map((name) => (
          <span
            key={name}
            className={`h-1 flex-1 rounded-full ${
              step === name || (step === "countdown" && name === "summary") ? "bg-emergency-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <FormError message={error} />

      {step === "details" ? (
        <section className="mt-6 space-y-5">
          <div>
            <p className="text-sm font-black text-ink">1. Selecciona el tipo de emergencia</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {emergencyTypes.map((item) => (
                <button
                  aria-pressed={type === item.value}
                  className={`grid min-h-20 place-items-center rounded-lg border p-2 text-center text-[11px] font-bold transition ${
                    type === item.value
                      ? "border-emergency-600 bg-emergency-50 text-emergency-700"
                      : "border-slate-200 bg-white text-ink"
                  }`}
                  key={item.value}
                  onClick={() => setType(item.value)}
                  type="button"
                >
                  <ReportTypeIcon size="small" type={item.label} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="app-card overflow-hidden">
            {location ? <TrackingMap emergency={location} /> : <div className="grid h-44 place-items-center bg-emergency-50 text-xs font-semibold text-emergency-700">Detectando ubicacion...</div>}
            <div className="p-4">
              <p className="text-sm font-black text-ink">2. Verifica tu ubicacion</p>
              <p className="mt-1 text-xs font-medium text-muted">
                {location ? `${location.addressText} (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})` : "Aun no detectada"}
              </p>
              <button className="btn-secondary mt-3 min-h-10 py-2 text-xs" disabled={locating} onClick={locate} type="button">
                <RefreshCw className="h-4 w-4" />{locating ? "Detectando..." : "Actualizar ubicacion"}
              </button>
            </div>
          </div>

          <label className="field-label">
            3. Descripcion breve <span className="font-medium text-muted">(opcional)</span>
            <textarea
              className="field-control min-h-24 resize-none"
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ej. Humo saliendo de una vivienda..."
              value={description}
            />
          </label>

          <div className="sticky bottom-0 -mx-4 bg-app/95 px-4 pb-2 pt-3 backdrop-blur"><button className="btn-primary" onClick={() => setStep("evidence")} type="button">Continuar</button></div>
        </section>
      ) : null}

      {step === "evidence" ? (
        <section className="mt-6 space-y-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle className="mr-2 inline h-4 w-4" />La evidencia es obligatoria. Ayuda a los bomberos a evaluar mejor la situacion.</div>
          <div className="app-card p-5 text-center">
            <Upload className="mx-auto h-9 w-9 text-emergency-600" />
            <p className="mt-3 text-sm font-black text-ink">1. Adjunta una foto o video</p>
            <p className="mt-1 text-xs text-muted">Formatos permitidos: JPG, PNG, MP4. Maximo 20 MB.</p>
            <label className="btn-secondary mt-5 cursor-pointer">
              Seleccionar archivo
              <input
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => setEvidence(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>
          </div>
          {evidence ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <span className="min-w-0 truncate text-sm font-bold text-success">{evidence.name}</span>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          ) : null}
          <div className="sticky bottom-0 -mx-4 grid grid-cols-2 gap-3 bg-app/95 px-4 pb-2 pt-3 backdrop-blur">
            <button className="btn-secondary" onClick={() => setStep("details")} type="button">
              Atras
            </button>
            <button className="btn-primary" onClick={() => setStep("summary")} type="button">
              Revisar
            </button>
          </div>
        </section>
      ) : null}

      {step === "summary" ? (
        <section className="mt-6 space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle className="mr-2 inline h-4 w-4" />Ultimo paso. Una vez enviado, la compania sera notificada.</div>
          <p className="text-sm font-black text-ink">Resumen de tu reporte</p>
          <SummaryRow label="Tipo" value={emergencyTypes.find((item) => item.value === type)?.label ?? "Sin seleccionar"} />
          <SummaryRow label="Ubicacion" value={location?.addressText ?? "Sin ubicacion"} />
          <SummaryRow label="Evidencia" value={evidence?.name ?? "Sin evidencia"} />
          <SummaryRow label="Descripcion" value={description || "Sin descripcion adicional"} />
          {!validation.ok ? <FormError message={validation.errors[0] ?? ""} /> : null}
          <div className="sticky bottom-0 -mx-4 space-y-2 bg-app/95 px-4 pb-2 pt-3 backdrop-blur"><button className="btn-primary" disabled={!validation.ok} onClick={startCountdown} type="button"><Send className="h-4 w-4" />Enviar reporte</button><button className="btn-secondary" onClick={() => setStep("evidence")} type="button">Editar evidencia</button></div>
        </section>
      ) : null}

      {step === "countdown" ? (
        <section className="mt-10 text-center">
          <div className="mx-auto grid h-44 w-44 place-items-center rounded-full border-[4px] border-emergency-600 bg-white text-6xl font-black text-ink shadow-soft">
            {sending ? "..." : countdown}
          </div>
          <p className="mt-6 text-sm font-bold text-ink">
            {sending ? "Enviando reporte..." : "Se enviara el reporte. Puedes cancelar antes de que llegue a cero."}
          </p>
          <button
            className="btn-secondary mt-6"
            disabled={sending}
            onClick={() => {
              setCountdown(5);
              setStep("summary");
            }}
            type="button"
          >
            <X className="h-4 w-4" />
            Cancelar envio
          </button>
        </section>
      ) : null}
    </AppShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  if (!message) return null;
  return <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{message}</p>;
}

function OfflineEmergencyScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <AppShell>
      <section className="grid min-h-dvh place-items-center px-4">
        <div className="text-center">
          <Phone className="mx-auto h-12 w-12 text-emergency-600" />
          <h1 className="mt-5 text-2xl font-black text-ink">Sin conexion</h1>
          <p className="mt-2 text-sm font-medium text-muted">Para emergencias, llama directamente al 116.</p>
          <a className="btn-primary mt-8" href="tel:116">
            <Phone className="h-4 w-4" />
            Llamar 116
          </a>
          <button className="btn-secondary mt-3" onClick={onRetry} type="button">
            Reintentar
          </button>
        </div>
      </section>
    </AppShell>
  );
}

function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const setOnlineStatus = () => setOnline(navigator.onLine);
    window.addEventListener("online", setOnlineStatus);
    window.addEventListener("offline", setOnlineStatus);
    return () => {
      window.removeEventListener("online", setOnlineStatus);
      window.removeEventListener("offline", setOnlineStatus);
    };
  }, []);

  return online;
}
