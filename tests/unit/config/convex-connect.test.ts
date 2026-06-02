import { describe, expect, it } from "vitest";
import { convexHttpToWebSocketOrigin } from "@/lib/config/convex-connect";

describe("convexHttpToWebSocketOrigin", () => {
  it("maps local http to ws", () => {
    expect(convexHttpToWebSocketOrigin("http://127.0.0.1:3210")).toBe(
      "ws://127.0.0.1:3210"
    );
  });

  it("maps https cloud to wss", () => {
    expect(
      convexHttpToWebSocketOrigin("https://happy-animal-123.convex.cloud")
    ).toBe("wss://happy-animal-123.convex.cloud");
  });
});
