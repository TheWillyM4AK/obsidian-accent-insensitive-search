export interface NormalizedText {
  text: string;
  starts: number[];
  ends: number[];
}

interface Grapheme {
  segment: string;
  index: number;
}

interface GraphemeSegmenter {
  segment(input: string): Iterable<Grapheme>;
}

type SegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: "grapheme" },
) => GraphemeSegmenter;

const Segmenter = (Intl as typeof Intl & { Segmenter?: SegmenterConstructor }).Segmenter;
const segmenter = Segmenter ? new Segmenter(undefined, { granularity: "grapheme" }) : null;
const mark = /\p{M}/u;
const emojiModifier = /[\u{1f3fb}-\u{1f3ff}]/u;
const regionalIndicator = /[\u{1f1e6}-\u{1f1ff}]/u;

// Alternativa para motores sin Intl.Segmenter: conserva marcas y secuencias emoji.
function* fallbackSegments(input: string): Iterable<Grapheme> {
  let segment = "";
  let index = 0;
  let offset = 0;
  let previous = "";
  let regionalCount = 0;

  for (const character of input) {
    const regional = regionalIndicator.test(character);
    const continues = segment.length > 0 && (
      mark.test(character)
      || emojiModifier.test(character)
      || character === "\u200d"
      || previous === "\u200d"
      || (previous === "\r" && character === "\n")
      || (regional && regionalCount === 1)
    );

    if (!continues && segment.length > 0) {
      yield { segment, index };
      segment = "";
    }
    if (segment.length === 0) index = offset;

    segment += character;
    regionalCount = regional ? (continues ? regionalCount + 1 : 1) : 0;
    previous = character;
    offset += character.length;
  }

  if (segment.length > 0) yield { segment, index };
}

function stripDiacritics(input: string): string {
  let result = "";
  let base = "";

  for (const character of input.normalize("NFD")) {
    if (!mark.test(character)) {
      result += character;
      base = character;
    } else if (character === "\u0303" && (base === "n" || base === "N")) {
      result += character;
    }
  }

  // Una ñ precompuesta evita que la búsqueda difusa la trate como una n.
  return result.normalize("NFC");
}

export function normalizeForSearch(input: string): NormalizedText {
  const normalized: NormalizedText = { text: "", starts: [], ends: [] };
  const segments = segmenter ? segmenter.segment(input) : fallbackSegments(input);

  for (const { segment, index } of segments) {
    const text = stripDiacritics(segment);
    normalized.text += text;

    // Los índices del buscador y de Obsidian se expresan en unidades UTF-16.
    for (let position = 0; position < text.length; position += 1) {
      normalized.starts.push(index);
      normalized.ends.push(index + segment.length);
    }
  }

  return normalized;
}

export function remapMatches(
  matches: Array<[number, number]>,
  normalized: NormalizedText,
): Array<[number, number]> {
  const mapped: Array<[number, number]> = [];

  for (const [start, end] of matches) {
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    const from = Math.max(0, Math.floor(start));
    const to = Math.min(normalized.text.length, Math.ceil(end));
    if (from >= to) continue;
    mapped.push([normalized.starts[from]!, normalized.ends[to - 1]!]);
  }

  mapped.sort((left, right) => left[0] - right[0] || left[1] - right[1]);
  const merged: Array<[number, number]> = [];

  for (const range of mapped) {
    const previous = merged[merged.length - 1];
    if (previous && range[0] <= previous[1]) {
      previous[1] = Math.max(previous[1], range[1]);
    } else {
      merged.push(range);
    }
  }

  return merged;
}
