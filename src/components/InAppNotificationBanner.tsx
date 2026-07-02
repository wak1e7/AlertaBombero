import { X } from "lucide-react";
import { Link } from "react-router-dom";
import type { InAppNotification } from "../domain/firefighterNotifications";

export function InAppNotificationBanner({
  notification,
  onDismiss
}: {
  notification: InAppNotification | null;
  onDismiss: () => void;
}) {
  if (!notification) return null;

  return (
    <div className="mt-4 rounded-lg border border-emergency-200 bg-emergency-50 p-4 shadow-soft" role="status">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-emergency-700">{notification.title}</p>
          <p className="mt-1 text-xs font-semibold text-ink">{notification.message}</p>
          <Link className="mt-3 inline-flex text-sm font-black text-emergency-700" to={notification.href}>
            Ver reporte
          </Link>
        </div>
        <button
          aria-label="Cerrar notificacion"
          className="grid h-8 w-8 place-items-center rounded-full bg-white text-emergency-700"
          onClick={onDismiss}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
