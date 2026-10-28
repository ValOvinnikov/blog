import { tv } from '@blog/ui/lib/styling';

export const signInPanelEmailFormVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    label: ['font-mono text-meta font-medium text-text'],
    submit: ['w-full'],
  },
});
