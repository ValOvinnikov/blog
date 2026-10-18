import { tv } from 'tailwind-variants';

export const accountMenuVariants = tv({
  slots: {
    menuRoot: ['flex flex-col items-center'],
    label: ['mb-3'],
    acctRow: ['mb-2 flex items-center gap-2 border-b border-border pb-3'],
    accountName: ['font-mono text-copy text-text'],
    accountEmail: ['font-mono text-meta text-subtle'],
    signOutItem: ['text-error'],
  },
});
