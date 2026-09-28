export type TPlainTextBlock = { children?: { text?: string }[] };

export const toPlainText = (blocks: TPlainTextBlock[] = []): string =>
  blocks
    .flatMap((block) => block.children ?? [])
    .map((child) => child.text ?? '')
    .join(' ')
    .trim();
