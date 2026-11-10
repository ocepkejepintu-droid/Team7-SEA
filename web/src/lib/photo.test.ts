import { describe, expect, it } from "vitest";
import { fitSize } from "./photo";

describe("fitSize", () => {
  it("shrinks a large landscape photo", () => expect(fitSize(4000, 3000, 1280)).toEqual({ w: 1280, h: 960 }));
  it("keeps a small photo as is", () => expect(fitSize(800, 600, 1280)).toEqual({ w: 800, h: 600 }));
  it("shrinks a portrait photo", () => expect(fitSize(3000, 4000, 1280)).toEqual({ w: 960, h: 1280 }));
});
