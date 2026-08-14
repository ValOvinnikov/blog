import { tv } from 'tailwind-variants';

export const tenantsTableVariants = tv({
  slots: {
    wrapper: ['overflow-hidden rounded-md border border-border bg-surface'],
    table: ['w-full border-collapse text-left text-sm'],
    head: [
      'border-b border-border px-4 py-2.5 font-mono text-meta font-semibold',
      'text-text-subtle uppercase tracking-wide',
    ],
    row: ['border-b border-border last:border-b-0'],
    cell: ['px-4 py-3 align-middle text-text'],
    name: ['font-medium text-text'],
    domain: ['font-mono text-meta text-text-subtle'],
    empty: ['p-8 text-center text-sm text-text-muted'],
  },
});
