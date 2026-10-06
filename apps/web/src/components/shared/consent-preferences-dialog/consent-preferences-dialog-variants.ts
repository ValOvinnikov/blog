import { tv } from '@blog/ui/lib/styling';

export const consentPreferencesDialogVariants = tv({
  slots: {
    root: [
      'm-auto w-full max-w-lg p-6',
      'rounded-md border border-border bg-surface text-text shadow-lg',
      'backdrop:bg-black/50',
      'motion-safe:opacity-0 motion-safe:scale-95',
      'motion-safe:open:opacity-100 motion-safe:open:scale-100',
      'motion-safe:open:starting:opacity-0 motion-safe:open:starting:scale-95',
      'motion-safe:transition-[opacity,scale,overlay,display] motion-safe:duration-200 motion-safe:ease-out motion-safe:transition-discrete',
      'motion-safe:backdrop:opacity-0',
      'motion-safe:open:backdrop:opacity-100',
      'motion-safe:open:starting:backdrop:opacity-0',
      'motion-safe:backdrop:transition-[opacity,overlay,display] motion-safe:backdrop:duration-200 motion-safe:backdrop:ease-out motion-safe:backdrop:transition-discrete',
    ],
  },
});
