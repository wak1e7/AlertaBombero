import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Phone, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { getSupabaseClient } from "../lib/supabase";
import { createAuthService } from "../services/authService";
import { clearLocalSessionState } from "../services/session";

type CitizenProfile = {
  dni: string;
  last_name: string;
  name: string;
  phone: string;
};

export function CitizenProfileScreen({ navItems }: { navItems: Parameters<typeof AppShell>[0]["navItems"] }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
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
        .select("name,last_name,phone,dni")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (alive) {
        setProfile(data as CitizenProfile | null);
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
    navigate("/ciudadano/login", { replace: true });
  }

  return (
    <AppShell navItems={navItems}>
      <header className="screen-header pt-6">
        <p className="section-kicker">Perfil</p>
        <h1 className="page-heading mt-1">Mi cuenta</h1>
        <p className="mt-1 text-xs font-medium text-muted">Gestiona tus datos y preferencias.</p>
      </header>

      {loading ? <p className="mt-6 text-sm font-semibold text-muted" role="status">Cargando perfil...</p> : null}
      {profile ? (
        <section className="mt-5 space-y-3">
          <div className="app-card p-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-emergency-50 text-emergency-600"><UserRound className="h-5 w-5" /></span><div><p className="text-base font-black text-ink">{profile.name} {profile.last_name}</p><p className="mt-0.5 text-xs font-medium text-muted">Ciudadano verificado</p></div></div><div className="mt-4 border-t border-slate-100 pt-3"><ProfileRow icon={<Phone className="h-4 w-4" />} label="Telefono" value={profile.phone} /><ProfileRow icon={<ShieldCheck className="h-4 w-4" />} label="DNI" value={profile.dni} /></div></div>
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
