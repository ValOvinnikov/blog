import { tv } from 'tailwind-variants';

export const lookPreviewVariants = tv({
  slots: {
    root: ['flex flex-col gap-4'],
    card: ['rounded-lg border border-border bg-surface shadow-sm'],
    cardHead: [
      'flex flex-wrap items-center justify-between gap-3 border-b border-border p-4',
    ],
    cardHeadText: ['min-w-0'],
    cardBody: ['flex flex-col gap-4 p-4'],
    previewBox: ['rounded-lg border border-border bg-primary p-5'],
    // No base classes — carries only the conditional `dark` class below, for
    // WindowChrome (an external component whose own surface/border/text
    // classes already read `--surface`/`--border`/`--text`) so re-theming the
    // sample content only needs toggling this class, not restyling it.
    previewSurface: [],
    brandRow: ['flex items-center gap-2'],
    brandName: ['text-base font-semibold text-text'],
    sampleHeading: ['text-xl font-semibold text-text'],
    samplePara: ['text-sm text-text-muted'],
    actionsRow: ['flex flex-wrap items-center gap-2 pt-1'],
    chip: [
      'inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs text-text-muted',
    ],
    note: ['text-xs text-text-subtle'],
    deviceBar: [
      'flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2',
    ],
    deviceDots: ['flex gap-1.5'],
    deviceDot: ['size-2 rounded-full bg-border-strong'],
    deviceUrl: [
      'flex-1 truncate text-center font-mono text-xs text-text-subtle',
    ],
    frame: [
      'mt-3 flex min-h-40 items-center justify-center rounded-md border border-dashed border-border p-4',
    ],
    framePlaceholder: ['text-center text-xs text-text-subtle'],
  },
  variants: {
    isDark: {
      true: {
        previewBox: ['dark'],
        previewSurface: ['dark'],
      },
      false: {},
    },
  },
});
