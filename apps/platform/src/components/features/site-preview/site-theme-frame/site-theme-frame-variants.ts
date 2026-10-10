import { tv } from '@platform/utils/tv/tv';

// Every class here reads a site token rather than an `--admin-*` one, since this box renders the tenant's theme.
export const siteThemeFrameVariants = tv({
  base: [
    'rounded-md border border-border bg-primary px-card-x py-card-y font-read text-[1rem] text-text',
  ],
  variants: {
    isDark: {
      // theme.css scopes its dark ramp to `.dark`, so the class must sit on the
      // element carrying the inline tenant tokens or its static values win.
      true: ['dark'],
      false: [],
    },
  },
});
