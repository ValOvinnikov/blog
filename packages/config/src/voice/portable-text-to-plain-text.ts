type TPlainTextBlocks = ReadonlyArray<{
  children?: ReadonlyArray<{ text?: string | null }> | null;
}>;

export function portableTextToPlainText(
  value: TPlainTextBlocks | null | undefined,
): string {
  if (!value || value.length === 0) return '';

  return value
    .map((block) =>
      (block.children ?? []).map((span) => span.text ?? '').join(''),
    )
    .join(' ')
    .trim();
}
