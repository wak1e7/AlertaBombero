import type { ReportLocation } from "../domain/report";

export async function getDeviceLocation(): Promise<ReportLocation> {
  if (!navigator.geolocation) throw new Error("Este dispositivo no admite ubicacion.");

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 15_000,
      timeout: 12_000
    });
  });

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  return { addressText: await resolveAddress(latitude, longitude), latitude, longitude };
}

async function resolveAddress(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("No se pudo resolver la direccion.");
    const data = await response.json() as { address?: Record<string, string>; display_name?: string };
    const address = data.address ?? {};
    const street = [address.road || address.pedestrian || address.footway, address.house_number].filter(Boolean).join(" ");
    const district = address.suburb || address.neighbourhood || address.city_district;
    const city = address.city || address.town || address.village;
    return [street, district, city].filter(Boolean).join(", ") || data.display_name || `Coordenadas actuales: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch {
    return `Coordenadas actuales: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}
