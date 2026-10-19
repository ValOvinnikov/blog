import { tv } from '@blog/ui/lib/styling';

export const accountMenuVariants = tv({
  slots: {
    menuRoot: ['flex flex-col items-center'],
    label: ['mb-3'],
    acctRow: ['mb-2 flex items-center gap-2 border-b border-border pb-3'],
    accountText: ['min-w-0 flex-1'],
    accountName: ['truncate font-mono text-meta text-text'],
    accountEmail: ['truncate font-mono text-meta text-subtle'],
    signOutItem: ['text-error'],
  },
});
