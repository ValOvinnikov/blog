export const localizedStringValues = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const text = (item as { value?: unknown } | null)?.value;

        return typeof text === 'string' && text.trim().length > 0 ? [text] : [];
      })
    : [];
