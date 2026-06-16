import { AlertaBomberoApp } from "@/components/alerta-bombero-app";

export default function Home() {
  return (
    <>
      <a href="#contenido-principal" className="skip-link">
        Ir al contenido principal
      </a>
      <main
        id="contenido-principal"
        role="main"
        aria-label="Aplicación ciudadana AlertaBombero"
        className="min-h-svh"
      >
        <AlertaBomberoApp />
      </main>
    </>
  );
}
