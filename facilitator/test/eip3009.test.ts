import { describe, expect, it } from "vitest";

import { decodeSignature } from "@auranode/x402-arc";

const R_HEX = "1".repeat(64);
const S_HEX = "2".repeat(64);

function makeSig(vByteHex: string): `0x${string}` {
  return `0x${R_HEX}${S_HEX}${vByteHex}` as `0x${string}`;
}

describe("decodeSignature", () => {
  it("decodes a v=27 signature into r/s/v", () => {
    const sig = makeSig("1b");
    const decoded = decodeSignature(sig);
    expect(decoded.r).toBe(`0x${R_HEX}`);
    expect(decoded.s).toBe(`0x${S_HEX}`);
    expect(decoded.v).toBe(27);
  });

  it("decodes a v=28 signature into r/s/v", () => {
    const sig = makeSig("1c");
    const decoded = decodeSignature(sig);
    expect(decoded.v).toBe(28);
  });

  it("normalizes v=0 to 27 (EIP-155 convention)", () => {
    const sig = makeSig("00");
    const decoded = decodeSignature(sig);
    expect(decoded.v).toBe(27);
  });

  it("normalizes v=1 to 28", () => {
    const sig = makeSig("01");
    const decoded = decodeSignature(sig);
    expect(decoded.v).toBe(28);
  });

  it("throws on missing 0x prefix", () => {
    const bad = `${R_HEX}${S_HEX}1b`;
    expect(() => decodeSignature(bad as `0x${string}`)).toThrow(/0x-prefixed/);
  });

  it("throws on signature shorter than 65 bytes", () => {
    const short = `0x${R_HEX}${S_HEX.slice(0, -2)}1b` as `0x${string}`;
    expect(() => decodeSignature(short)).toThrow(/Invalid signature length/);
  });

  it("throws on signature longer than 65 bytes", () => {
    const long = `0x${R_HEX}${S_HEX}1b00` as `0x${string}`;
    expect(() => decodeSignature(long)).toThrow(/Invalid signature length/);
  });

  it("throws on v that does not normalize to 27 or 28", () => {
    const sig = makeSig("ff");
    expect(() => decodeSignature(sig)).toThrow(/Invalid v value/);
  });

  it("preserves r and s exactly (no leading-zero stripping)", () => {
    const r0 = "0".repeat(63) + "a";
    const s0 = "0".repeat(63) + "b";
    const sig = `0x${r0}${s0}1b` as `0x${string}`;
    const decoded = decodeSignature(sig);
    expect(decoded.r).toBe(`0x${r0}`);
    expect(decoded.s).toBe(`0x${s0}`);
  });
});
