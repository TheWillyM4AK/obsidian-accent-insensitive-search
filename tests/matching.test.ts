import { describe, expect, it } from "vitest";
import { mergeResults, NormalizedMatcher, type PrepareSearch } from "../src/matching";

// Buscador difuso determinista: compara subsecuencias e ignora mayúsculas.
const prepare: PrepareSearch = (query) => (text) => {
  const needle = query.toLowerCase();
  const haystack = text.toLowerCase();
  const matches: Array<[number, number]> = [];
  let cursor = 0;
  for (let index = 0; index < needle.length; index += 1) {
    const position = haystack.indexOf(needle[index]!, cursor);
    if (position < 0) return null;
    matches.push([position, position + 1]);
    cursor = position + 1;
  }
  return { score: 100 - (matches[0]?.[0] ?? 0) - text.length / 100, matches };
};

describe("NormalizedMatcher", () => {
  it("deja los nombres ASCII sin cambios a cargo de la búsqueda original", () => {
    const query = new NormalizedMatcher(prepare).query("angel");
    expect(query.changed("Angel")).toBe(false);
    expect(query.alias("Angel")).toBeNull();
    expect(query.path("Personas/Angel.md")).toBeNull();
  });

  it("encuentra nombres y aliases sin escribir las tildes", () => {
    const query = new NormalizedMatcher(prepare).query("angel garcia");
    expect(query.alias("Ángel García López")?.matches).toEqual([[0, 12]]);
  });

  it("normaliza también consultas con tildes y conserva la comparación de mayúsculas", () => {
    const query = new NormalizedMatcher(prepare).query("ÁNGEL");
    expect(query.changed("Angel")).toBe(true);
    expect(query.alias("Angel")?.matches).toEqual([[0, 5]]);
  });

  it("ignora diéresis y conserva la distinción de ñ en NFC y NFD", () => {
    const matcher = new NormalizedMatcher(prepare);
    expect(matcher.query("pinguino").alias("pingüino")?.matches).toEqual([[0, 8]]);
    expect(matcher.query("ano").alias("año")).toBeNull();
    expect(matcher.query("ano").alias("an\u0303o")).toBeNull();
    expect(matcher.query("año").alias("an\u0303o")?.matches).toEqual([[0, 4]]);
  });

  it("prefiere el nombre final y desplaza sus resaltados a la ruta original", () => {
    const match = new NormalizedMatcher(prepare).query("angel").path("Personas/Ángel.md");
    expect(match?.matches).toEqual([[9, 14]]);
    expect(match?.score).toBe(prepare("angel")("Angel.md")?.score);
  });

  it("busca en carpetas con acentos y penaliza las coincidencias de la ruta", () => {
    const match = new NormalizedMatcher(prepare).query("viajes").path("Viájes/Casa.md");
    expect(match?.matches).toEqual([[0, 6]]);
    expect(match?.score).toBe(prepare("viajes")("Viajes/Casa.md")!.score - 1);
  });

  it("conserva las posiciones de texto NFD y de emojis anteriores al nombre", () => {
    const match = new NormalizedMatcher(prepare).query("angel").path("😀/A\u0301ngel.md");
    expect(match?.matches).toEqual([[3, 9]]);
  });

  it("devuelve null para nombres que tampoco casan normalizados", () => {
    const query = new NormalizedMatcher(prepare).query("garcia");
    expect(query.alias("Ángel")).toBeNull();
    expect(query.path("Viájes/Casa.md")).toBeNull();
  });

  it("reutiliza resultados normalizados y limita la caché", () => {
    const matcher = new NormalizedMatcher(prepare, 2);
    const first = matcher.normalize("Ángel");
    expect(matcher.normalize("Ángel")).toBe(first);
    matcher.normalize("pingüino");
    matcher.normalize("García");
    expect(matcher.normalize("Ángel")).not.toBe(first);
    const cached = matcher.normalize("Ángel");
    matcher.clear();
    expect(matcher.normalize("Ángel")).not.toBe(cached);
  });
});

describe("mergeResults", () => {
  const key = (result: { id: string; score: number }) => result.id;
  const score = (result: { id: string; score: number }) => result.score;

  it("conserva el array original cuando no hay resultados nuevos ni mejores", () => {
    const originals = [{ id: "angel", score: 10 }];
    expect(mergeResults(originals, [], key, score)).toBe(originals);
    expect(mergeResults(originals, [{ id: "angel", score: 10 }], key, score)).toBe(originals);
    expect(mergeResults(originals, [{ id: "angel", score: 5 }], key, score)).toBe(originals);
  });

  it("incorpora resultados nuevos, conserva el mejor duplicado y ordena por puntuación", () => {
    const original = { id: "angel", score: 5 };
    const other = { id: "pinguino", score: 10 };
    const better = { id: "angel", score: 20 };
    const originals = [other, original];
    const additions = [better, { id: "nuevo", score: 15 }, { id: "angel", score: 3 }];
    expect(mergeResults(originals, additions, key, score)).toEqual([
      better,
      { id: "nuevo", score: 15 },
      other,
    ]);
    expect(originals).toEqual([other, original]);
  });

  it("conserva el orden original en empates y añade los nuevos detrás", () => {
    const originals = [{ id: "primero", score: 10 }, { id: "segundo", score: 10 }];
    expect(mergeResults(originals, [{ id: "tercero", score: 10 }], key, score))
      .toEqual([...originals, { id: "tercero", score: 10 }]);
  });

  it("no duplica resultados que solo aparecen entre las adiciones", () => {
    expect(mergeResults([], [
      { id: "angel", score: 5 },
      { id: "angel", score: 8 },
      { id: "angel", score: 7 },
    ], key, score)).toEqual([{ id: "angel", score: 8 }]);
  });
});
