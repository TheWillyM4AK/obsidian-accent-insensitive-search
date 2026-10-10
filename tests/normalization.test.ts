import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeForSearch, remapMatches } from "../src/normalization";

describe("normalizeForSearch", () => {
  it.each([
    ["Ángel García López", "Angel Garcia Lopez"],
    ["ÁNGEL", "ANGEL"],
    ["pingüino", "pinguino"],
    ["ÁÉÍÓÚ ÀÈÌÒÙ ÂÊÎÔÛ ÄËÏÖÜ", "AEIOU AEIOU AEIOU AEIOU"],
    ["año NIÑO mañana", "año NIÑO mañana"],
    ["an\u0303o NIN\u0303O", "año NIÑO"],
    ["n\u0301\u0303 n\u0303\u0301", "ñ ñ"],
    ["anó", "ano"],
    ["Personas/Ángel 😀.md", "Personas/Angel 😀.md"],
    ["a\u0301\u0308ngel", "angel"],
    ["", ""],
  ])("normaliza %j como %j", (input, output) => {
    expect(normalizeForSearch(input).text).toBe(output);
  });

  it("conserva las mayúsculas para que el buscador gestione su comparación", () => {
    expect(normalizeForSearch("Ángel").text).toBe("Angel");
  });

  it("mantiene n y ñ como caracteres distintos, también en NFD", () => {
    for (const input of ["año", "an\u0303o"]) {
      const normalized = normalizeForSearch(input).text;
      expect(normalized).toBe("año");
      expect(normalized.includes("n")).toBe(false);
    }
  });

  it("mapea cada índice UTF-16 a su carácter original completo", () => {
    expect(normalizeForSearch("Áa\u0301😀")).toEqual({
      text: "Aa😀",
      starts: [0, 1, 3, 3],
      ends: [1, 3, 5, 5],
    });
  });

  it("mantiene junto un emoji formado por varios puntos de código", () => {
    const normalized = normalizeForSearch("👩🏽‍💻Á");
    expect(normalized.text).toBe("👩🏽‍💻A");
    expect(normalized.starts).toEqual([0, 0, 0, 0, 0, 0, 0, 7]);
    expect(normalized.ends).toEqual([7, 7, 7, 7, 7, 7, 7, 8]);
  });

  it("conserva caracteres que se descomponen sin marcas, como Hangul", () => {
    expect(normalizeForSearch("한글 Ángel").text).toBe("한글 Angel");
  });
});

describe("remapMatches", () => {
  it("incluye las marcas originales de los caracteres descompuestos", () => {
    expect(remapMatches([[0, 1]], normalizeForSearch("A\u0301ngel"))).toEqual([[0, 2]]);
  });

  it("no divide pares surrogate al resaltar", () => {
    expect(remapMatches([[1, 2]], normalizeForSearch("Á😀z"))).toEqual([[1, 3]]);
    expect(remapMatches([[2, 3]], normalizeForSearch("Á😀z"))).toEqual([[1, 3]]);
  });

  it("incluye toda la secuencia emoji aunque solo case una parte", () => {
    expect(remapMatches([[5, 7]], normalizeForSearch("👩🏽‍💻Á"))).toEqual([[0, 7]]);
  });

  it("ordena y fusiona rangos adyacentes o solapados sin modificar la entrada", () => {
    const matches: Array<[number, number]> = [[4, 6], [1, 3], [0, 1], [2, 4]];
    expect(remapMatches(matches, normalizeForSearch("Ángel!"))).toEqual([[0, 6]]);
    expect(matches).toEqual([[4, 6], [1, 3], [0, 1], [2, 4]]);
  });

  it("mantiene separados los rangos con huecos", () => {
    expect(remapMatches([[0, 1], [4, 5]], normalizeForSearch("Ángel")))
      .toEqual([[0, 1], [4, 5]]);
  });

  it("descarta rangos vacíos o inválidos y limita los extremos", () => {
    expect(remapMatches(
      [[-3, 1], [3, 100], [2, 2], [4, 1], [100, 200], [NaN, 2]],
      normalizeForSearch("Ángel"),
    )).toEqual([[0, 1], [3, 5]]);
    expect(remapMatches([[0, 1]], normalizeForSearch(""))).toEqual([]);
  });
});

describe("normalización sin Intl.Segmenter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("conserva marcas, pares surrogate, modificadores y secuencias ZWJ", async () => {
    vi.stubGlobal("Intl", { Segmenter: undefined });
    vi.resetModules();
    const fallback = await import("../src/normalization");
    const normalized = fallback.normalizeForSearch("A\u0301👩🏽‍💻n\u0303");
    expect(normalized.text).toBe("A👩🏽‍💻ñ");
    expect(normalized.starts).toEqual([0, 2, 2, 2, 2, 2, 2, 2, 9]);
    expect(normalized.ends).toEqual([2, 9, 9, 9, 9, 9, 9, 9, 11]);
  });

  it("mantiene juntas las parejas de indicadores regionales", async () => {
    vi.stubGlobal("Intl", { Segmenter: undefined });
    vi.resetModules();
    const fallback = await import("../src/normalization");
    const normalized = fallback.normalizeForSearch("🇪🇸🇫🇷");
    expect(normalized.starts).toEqual([0, 0, 0, 0, 4, 4, 4, 4]);
    expect(normalized.ends).toEqual([4, 4, 4, 4, 8, 8, 8, 8]);
  });
});
