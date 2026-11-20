import type { TTextBlock } from '@shinefold/utils/portable-text';

export const toPlainText = (blocks: readonly TTextBlock[] = []): string =>
  blocks
    .flatMap((block) => block.children ?? [])
    .map((child) => child.text ?? '')
    .join(' ')
    .trim();
