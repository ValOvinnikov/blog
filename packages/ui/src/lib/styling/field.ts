export const FIELD_CONTROL = [
  'w-full rounded-sm border bg-surface px-3 py-2',
  'font-mono text-copy text-text placeholder:text-subtle',
  'transition-colors duration-base ease-smooth',
  'border-field-boundary',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-ambient',
  'disabled:pointer-events-none disabled:border-border-strong disabled:bg-surface-2 disabled:text-muted disabled:placeholder:opacity-50',
];

export const FIELD_CONTROL_INVALID = [
  'border-error text-error',
  'disabled:border-error',
];
