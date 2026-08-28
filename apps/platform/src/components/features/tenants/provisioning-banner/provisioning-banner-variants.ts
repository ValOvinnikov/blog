import { tv } from '@platform/utils/tv/tv';

export const provisioningBannerVariants = tv({
  slots: {
    root: ['flex flex-col gap-2.5'],
    ownerElevationRow: ['flex flex-wrap items-center gap-2 px-1'],
    ownerElevationDescription: ['text-[12.5px] text-admin-muted'],
  },
});
