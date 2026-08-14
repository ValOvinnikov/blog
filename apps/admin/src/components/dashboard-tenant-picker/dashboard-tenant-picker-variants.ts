import { tv } from 'tailwind-variants';

export const dashboardTenantPickerVariants = tv({
  slots: {
    root: [
      'mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4',
    ],
    description: ['text-sm text-text-muted'],
  },
});
