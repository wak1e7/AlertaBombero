import { describe, expect, it } from "vitest";
import { formatCoordinatePair, isValidCoordinate } from "./location";

describe("location domain", () => {
  it("accepts finite latitude and longitude in geographic ranges", () => {
    expect(isValidCoordinate({ latitude: -12.0464, longitude: -77.0428 })).toBe(true);
  });

  it("rejects invalid geographic ranges", () => {
    expect(isValidCoordinate({ latitude: -91, longitude: -77 })).toBe(false);
    expect(isValidCoordinate({ latitude: -12, longitude: -181 })).toBe(false);
    expect(isValidCoordinate({ latitude: Number.NaN, longitude: -77 })).toBe(false);
  });

  it("formats coordinates for compact operational display", () => {
    expect(formatCoordinatePair({ latitude: -12.0464321, longitude: -77.0428123 })).toBe("-12.0464, -77.0428");
  });
});
