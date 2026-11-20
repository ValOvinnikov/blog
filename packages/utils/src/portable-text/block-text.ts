import { countWords } from '@shinefold/utils/primitives';

export type TTextBlock = {
  children?: ReadonlyArray<{ text?: string | null }> | null;
};

export const toBlockText = ({ children }: TTextBlock): string =>
  (children ?? []).map(({ text }) => text ?? '').join('');

export const countBlockWords = (blocks: readonly TTextBlock[]): number =>
  blocks.reduce((total, block) => total + countWords(toBlockText(block)), 0);

export const hasBlockText = (blocks: readonly TTextBlock[]): boolean =>
  blocks.some((block) => toBlockText(block).trim().length > 0);
