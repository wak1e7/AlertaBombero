import { CircleMarker, MapContainer, Polyline, TileLayer } from "react-leaflet";
import type { Coordinate } from "../domain/location";

export function TrackingMap({
  emergency,
  firefighter
}: {
  emergency: Coordinate;
  firefighter?: Coordinate | null;
}) {
  const center: [number, number] = firefighter
    ? [(emergency.latitude + firefighter.latitude) / 2, (emergency.longitude + firefighter.longitude) / 2]
    : [emergency.latitude, emergency.longitude];
  const emergencyPosition: [number, number] = [emergency.latitude, emergency.longitude];
  const firefighterPosition: [number, number] | null = firefighter ? [firefighter.latitude, firefighter.longitude] : null;

  return (
    <div className="app-card overflow-hidden">
      <MapContainer center={center} className="h-56 w-full sm:h-64" scrollWheelZoom={false} zoom={14}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={emergencyPosition} pathOptions={{ color: "#D62828", fillColor: "#D62828" }} radius={9} />
        {firefighterPosition ? (
          <>
            <CircleMarker center={firefighterPosition} pathOptions={{ color: "#2563EB", fillColor: "#2563EB" }} radius={8} />
            <Polyline pathOptions={{ color: "#2563EB", dashArray: "6 6", weight: 3 }} positions={[firefighterPosition, emergencyPosition]} />
          </>
        ) : null}
      </MapContainer>
      <div className="grid grid-cols-2 gap-2 p-3 text-xs font-bold text-muted">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emergency-600" />
          Emergencia
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          Bombero
        </span>
      </div>
    </div>
  );
}
