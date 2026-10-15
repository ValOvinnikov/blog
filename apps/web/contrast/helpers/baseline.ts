import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type TCaseBaseline = Record<string, string[]>;
export type TBaseline = Record<string, TCaseBaseline>;

const KEY_SEPARATOR = ' | ';

const BASELINE_PATH = join(import.meta.dirname, '../baseline.json');
export const BASELINE_PARTS_DIR = join(
  import.meta.dirname,
  '../.baseline-parts',
);

export const isUpdatingBaseline = () =>
  process.env.CONTRAST_UPDATE_BASELINE === '1';

export const readBaseline = (): TBaseline =>
  JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as TBaseline;

export const toFailureKey = (state: string, element: string) =>
  `${state}${KEY_SEPARATOR}${element}`;

export const flattenCase = (caseBaseline: TCaseBaseline = {}): string[] =>
  Object.entries(caseBaseline).flatMap(([element, states]) =>
    states.map((state) => toFailureKey(state, element)),
  );

const groupCase = (failureKeys: string[]): TCaseBaseline => {
  const grouped: TCaseBaseline = {};
  failureKeys.forEach((key) => {
    const index = key.indexOf(KEY_SEPARATOR);
    const element = key.slice(index + KEY_SEPARATOR.length);
    grouped[element] = [...(grouped[element] ?? []), key.slice(0, index)];
  });
  return grouped;
};

// One line per element keeps a reset reviewable; Prettier would put every state on its own line.
const formatBaseline = (baseline: TBaseline): string => {
  const cases = Object.keys(baseline)
    .sort()
    .flatMap((caseKey) => {
      const caseBaseline = baseline[caseKey] ?? {};
      const elements = Object.keys(caseBaseline).sort();
      if (elements.length === 0) return [];
      const lines = elements.map(
        (element) =>
          `    ${JSON.stringify(element)}: ${JSON.stringify(caseBaseline[element]).replaceAll('","', '", "')}`,
      );
      return [`  ${JSON.stringify(caseKey)}: {\n${lines.join(',\n')}\n  }`];
    });
  return `{\n${cases.join(',\n')}\n}\n`;
};

export const writeBaselinePart = (caseKey: string, failureKeys: string[]) => {
  mkdirSync(BASELINE_PARTS_DIR, { recursive: true });
  const fileName = createHash('sha1').update(caseKey).digest('hex');
  writeFileSync(
    join(BASELINE_PARTS_DIR, `${fileName}.json`),
    JSON.stringify({ caseKey, caseBaseline: groupCase(failureKeys) }),
  );
};

export const writeBaseline = (baseline: TBaseline) => {
  writeFileSync(BASELINE_PATH, formatBaseline(baseline));
};
