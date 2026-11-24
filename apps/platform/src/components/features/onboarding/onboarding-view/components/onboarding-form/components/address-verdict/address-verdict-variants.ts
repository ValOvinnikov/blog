import { SITE_ADDRESS_STATUS } from '@platform/constants/onboarding';
import { tv } from '@platform/utils/tv/tv';

export const addressVerdictVariants = tv({
  slots: {
    root: ['@container flex min-w-0'],
    chip: [
      'inline-flex max-w-full items-start gap-2',
      'rounded-platform border py-[7px] pr-3 pl-[9px]',
    ],
    glyph: ['flex h-[19px] shrink-0 items-center'],
    message: ['min-w-0 text-platform-13-5 leading-platform-19 font-semibold'],
    detail: ['sr-only @sm:not-sr-only'],
    host: ['font-platform-mono font-medium'],
    announcement: ['sr-only'],
  },
  variants: {
    status: {
      [SITE_ADDRESS_STATUS.IDLE]: {},
      [SITE_ADDRESS_STATUS.CHECKING]: {
        chip: ['border-platform-line bg-platform-surface'],
        glyph: ['text-platform-muted'],
        message: ['text-platform-text'],
      },
      [SITE_ADDRESS_STATUS.AVAILABLE]: {
        chip: ['border-platform-ok/30 bg-platform-ok-weak'],
        glyph: ['text-platform-ok'],
        message: ['truncate text-platform-ok'],
      },
      [SITE_ADDRESS_STATUS.UNAVAILABLE]: {},
      [SITE_ADDRESS_STATUS.UNVERIFIED]: {
        chip: ['border-platform-warn/30 bg-platform-warn-weak'],
        glyph: ['text-platform-warn'],
        message: ['font-medium text-platform-text'],
      },
    },
  },
});
