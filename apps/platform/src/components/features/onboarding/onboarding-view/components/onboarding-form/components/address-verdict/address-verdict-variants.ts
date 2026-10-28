import { SITE_ADDRESS_STATUS } from '@platform/constants/onboarding';
import { tv } from '@platform/utils/tv/tv';

export const addressVerdictVariants = tv({
  slots: {
    root: ['flex min-w-0'],
    chip: [
      'inline-flex max-w-full items-start gap-2',
      'rounded-admin border py-[7px] pr-3 pl-[9px]',
    ],
    glyph: ['flex h-[19px] shrink-0 items-center'],
    message: ['min-w-0 text-admin-13-5 leading-[19px] font-semibold'],
  },
  variants: {
    status: {
      [SITE_ADDRESS_STATUS.IDLE]: {},
      [SITE_ADDRESS_STATUS.CHECKING]: {
        chip: ['border-admin-line bg-admin-surface'],
        glyph: ['text-admin-muted'],
        message: ['text-admin-text'],
      },
      [SITE_ADDRESS_STATUS.AVAILABLE]: {
        chip: ['border-admin-ok/30 bg-admin-ok-weak'],
        glyph: ['text-admin-ok'],
        message: ['text-admin-ok'],
      },
      [SITE_ADDRESS_STATUS.UNAVAILABLE]: {
        chip: ['border-admin-bad/30 bg-admin-bad-weak'],
        glyph: ['text-admin-bad'],
        message: ['text-admin-bad'],
      },
      [SITE_ADDRESS_STATUS.UNVERIFIED]: {
        chip: ['border-admin-warn/30 bg-admin-warn-weak'],
        glyph: ['text-admin-warn'],
        message: ['font-medium text-admin-text'],
      },
    },
  },
});
