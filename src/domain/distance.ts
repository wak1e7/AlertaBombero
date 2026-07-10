import { isValidCoordinate, type Coordinate } from "./location";

export function distanceInKilometers(from: Coordinate, to: Coordinate): number | null {
  if (!isValidCoordinate(from) || !isValidCoordinate(to)) return null;

  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitudeValue = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitudeValue) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function formatApproximateDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.max(1, Math.round(distanceKm * 1000))} m aprox.`;
  return `${distanceKm.toFixed(1)} km aprox.`;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
