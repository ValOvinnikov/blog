import { tv } from 'tailwind-variants';

export const voiceSettingsVariants = tv({
  slots: {
    root: ['flex max-w-3xl flex-col gap-6'],
    alert: ['w-fit'],
    advancedBody: ['flex flex-col gap-4'],
  },
});
