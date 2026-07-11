import { describe, expect, it } from "vitest";
import { demoCredentials } from "./demoCredentials";

describe("demo credentials", () => {
  it("documents a working citizen demo account", () => {
    expect(demoCredentials.citizen).toEqual({
      password: "seguro123",
      phone: "+51999888777"
    });
  });

  it("documents preloaded firefighter demo accounts", () => {
    expect(demoCredentials.firefighters.map((item) => item.code)).toEqual(["A27001", "A27002", "A10801"]);
    expect(demoCredentials.firefighters.every((item) => item.password === "bombero123")).toBe(true);
  });
});
