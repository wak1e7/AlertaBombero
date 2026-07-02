import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
      <header className="pt-6">
        <p className="text-xs font-bold uppercase tracking-wide text-emergency-600">Perfil</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Datos del bombero</h1>
      </header>

      {loading ? <p className="mt-6 text-sm font-semibold text-muted">Cargando perfil...</p> : null}
      {profile ? (
        <section className="mt-5 space-y-3">
          <ProfileRow label="Nombre" value={`${profile.name} ${profile.last_name}`} />
          <ProfileRow label="Codigo" value={profile.firefighter_code} />
          <ProfileRow label="Telefono" value={profile.phone} />
          <Link className="btn-secondary mt-5" to="/bombero/historial">
            Historial de mi compania
          </Link>
          <button className="btn-secondary mt-5" onClick={signOut} type="button">
            Cerrar sesion
          </button>
        </section>
      ) : null}
    </AppShell>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-black text-ink">{value}</p>
    </div>
  );
}
