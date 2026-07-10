import { describe, expect, it } from "vitest";
import { distanceInKilometers, formatApproximateDistance } from "./distance";

describe("distance", () => {
  it("calculates a Haversine distance between two coordinates", () => {
    const distance = distanceInKilometers(
      { latitude: -12.0464, longitude: -77.0428 },
      { latitude: -12.0564, longitude: -77.0428 }
    );

    expect(distance).toBeCloseTo(1.11, 2);
    expect(formatApproximateDistance(distance!)).toBe("1.1 km aprox.");
  });

  it("formats nearby reports in meters", () => {
    expect(formatApproximateDistance(0.125)).toBe("125 m aprox.");
  });

  it("does not calculate distances with invalid coordinates", () => {
    expect(
      distanceInKilometers({ latitude: -12.0464, longitude: -77.0428 }, { latitude: 120, longitude: -77.0428 })
    ).toBeNull();
  });
});
