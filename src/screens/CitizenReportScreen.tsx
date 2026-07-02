import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MapPin, Phone, RefreshCw, Send, Upload, X } from "lucide-react";
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
      <header className="flex items-center gap-3 pt-6">
        <Link className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-soft" to="/ciudadano/inicio">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emergency-600">Reporte ciudadano</p>
          <h1 className="text-xl font-black text-ink">Nueva emergencia</h1>
        </div>
      </header>

      <div className="mt-6 flex gap-2">
        {["details", "evidence", "summary"].map((name) => (
          <span
            key={name}
            className={`h-2 flex-1 rounded-full ${
              step === name || (step === "countdown" && name === "summary") ? "bg-emergency-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <FormError message={error} />

      {step === "details" ? (
        <section className="mt-5 space-y-5">
          <div>
            <p className="text-sm font-black text-ink">Tipo de emergencia</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {emergencyTypes.map((item) => (
                <button
                  className={`rounded-lg border p-3 text-left text-sm font-bold ${
                    type === item.value
                      ? "border-emergency-600 bg-emergency-50 text-emergency-700"
                      : "border-slate-200 bg-white text-ink"
                  }`}
                  key={item.value}
                  onClick={() => setType(item.value)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm font-semibold text-ink">
            Descripcion breve
            <textarea
              className="mt-2 min-h-28 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emergency-500 focus:ring-4 focus:ring-emergency-100"
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ej. Humo saliendo de una vivienda..."
              value={description}
            />
          </label>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-emergency-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-ink">Ubicacion</p>
                <p className="mt-1 text-xs font-medium text-muted">
                  {location
                    ? `${location.addressText} (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
                    : "Aun no detectada"}
                </p>
              </div>
            </div>
            <button className="btn-secondary mt-4" disabled={locating} onClick={locate} type="button">
              <RefreshCw className="h-4 w-4" />
              {locating ? "Detectando..." : "Actualizar ubicacion"}
            </button>
          </div>

          <button className="btn-primary" onClick={() => setStep("evidence")} type="button">
            Continuar
          </button>
        </section>
      ) : null}

      {step === "evidence" ? (
        <section className="mt-5 space-y-5">
          <div className="rounded-lg border border-dashed border-emergency-200 bg-white p-5 text-center">
            <Upload className="mx-auto h-9 w-9 text-emergency-600" />
            <p className="mt-3 text-sm font-black text-ink">Adjunta foto o video</p>
            <p className="mt-1 text-xs text-muted">La evidencia es obligatoria y puede pesar hasta 20 MB.</p>
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
          <div className="grid grid-cols-2 gap-3">
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
        <section className="mt-5 space-y-4">
          <SummaryRow label="Tipo" value={emergencyTypes.find((item) => item.value === type)?.label ?? "Sin seleccionar"} />
          <SummaryRow label="Ubicacion" value={location?.addressText ?? "Sin ubicacion"} />
          <SummaryRow label="Evidencia" value={evidence?.name ?? "Sin evidencia"} />
          <SummaryRow label="Descripcion" value={description || "Sin descripcion adicional"} />
          {!validation.ok ? <FormError message={validation.errors[0] ?? ""} /> : null}
          <button className="btn-primary" disabled={!validation.ok} onClick={startCountdown} type="button">
            <Send className="h-4 w-4" />
            Enviar reporte
          </button>
          <button className="btn-secondary" onClick={() => setStep("evidence")} type="button">
            Editar evidencia
          </button>
        </section>
      ) : null}

      {step === "countdown" ? (
        <section className="mt-10 text-center">
          <div className="mx-auto grid h-44 w-44 place-items-center rounded-full bg-emergency-600 text-6xl font-black text-white shadow-[0_20px_60px_rgba(214,40,40,0.36)]">
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
      <section className="grid min-h-dvh place-items-center">
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
