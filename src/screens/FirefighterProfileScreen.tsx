import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, ClipboardList, LogOut, Phone, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { getSupabaseClient } from "../lib/supabase";
import { createAuthService } from "../services/authService";
import { clearLocalSessionState } from "../services/session";

type FirefighterProfile = {
  firefighter_code: string;
  last_name: string;
  name: string;
  phone: string;
};

export function FirefighterProfileScreen({ navItems }: { navItems: Parameters<typeof AppShell>[0]["navItems"] }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FirefighterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      const { data: sessionData } = await getSupabaseClient().auth.getSession();
      const authUserId = sessionData.session?.user.id;

      if (!authUserId) {
        setLoading(false);
        return;
      }

      const { data } = await getSupabaseClient()
        .from("profiles")
        .select("name,last_name,phone,firefighter_code")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (alive) {
        setProfile(data as FirefighterProfile | null);
        setLoading(false);
      }
    }

    loadProfile();

    return () => {
      alive = false;
    };
  }, []);

  async function signOut() {
    await createAuthService(getSupabaseClient()).signOut();
    clearLocalSessionState();
    navigate("/bombero/login", { replace: true });
  }

  return (
    <AppShell navItems={navItems}>
      <header className="screen-header pt-6">
        <p className="section-kicker">Perfil</p>
        <h1 className="page-heading mt-1">Gestiona tu cuenta</h1>
        <p className="mt-1 text-xs font-medium text-muted">Estado operativo, cuenta y preferencias.</p>
      </header>

      {loading ? <p className="mt-6 text-sm font-semibold text-muted" role="status">Cargando perfil...</p> : null}
      {profile ? (
        <section className="mt-5 space-y-3">
          <div className="app-card p-4"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-emergency-50 text-emergency-600"><UserRound className="h-6 w-6" /></span><div><p className="text-base font-black text-ink">{profile.name} {profile.last_name}</p><p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> En linea</p><span className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-ink">{profile.firefighter_code}</span></div></div><div className="mt-4 border-t border-slate-100 pt-3"><ProfileRow icon={<ShieldCheck className="h-4 w-4" />} label="Codigo operativo" value={profile.firefighter_code} /><ProfileRow icon={<Phone className="h-4 w-4" />} label="Telefono" value={profile.phone} /><ProfileRow icon={<Building2 className="h-4 w-4" />} label="Cobertura" value="Cuerpo de Bomberos - Lambayeque" /></div></div>
          <Link className="app-card flex min-h-16 items-center justify-between p-3.5" to="/bombero/configuracion"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-emergency-50 text-emergency-600"><Settings2 className="h-5 w-5" /></span><span><strong className="block text-sm text-ink">Configuracion y accesibilidad</strong><span className="mt-0.5 block text-[11px] text-muted">Lectura, contraste y movimiento</span></span></span><span className="text-emergency-600">›</span></Link>
          <Link className="btn-secondary" to="/bombero/historial"><ClipboardList className="h-4 w-4" /> Historial de mi compania</Link>
          <button className="btn-secondary" onClick={signOut} type="button"><LogOut className="h-4 w-4" /> Cerrar sesion</button>
        </section>
      ) : null}
    </AppShell>
  );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-emergency-600">{icon}</span>
      <div><p className="text-[11px] font-bold text-muted">{label}</p><p className="text-sm font-extrabold text-ink">{value}</p></div>
    </div>
  );
}
