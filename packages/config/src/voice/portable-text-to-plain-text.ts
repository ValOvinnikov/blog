import { toBlockText, type TTextBlock } from '@shinefold/utils/portable-text';

export function portableTextToPlainText(
  value: ReadonlyArray<TTextBlock> | null | undefined,
): string {
  return (value ?? []).map(toBlockText).join(' ').trim();
}
