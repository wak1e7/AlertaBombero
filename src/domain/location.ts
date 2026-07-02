export type Coordinate = {
  latitude: number;
  longitude: number;
};

export function isValidCoordinate(coordinate: Coordinate): boolean {
  return (
    Number.isFinite(coordinate.latitude) &&
    Number.isFinite(coordinate.longitude) &&
    coordinate.latitude >= -90 &&
    coordinate.latitude <= 90 &&
    coordinate.longitude >= -180 &&
    coordinate.longitude <= 180
  );
}

export function formatCoordinatePair(coordinate: Coordinate): string {
  return `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`;
}
