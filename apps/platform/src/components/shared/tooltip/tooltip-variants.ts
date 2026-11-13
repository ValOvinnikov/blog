import { tv } from '@platform/utils/tv/tv';

export const tooltipVariants = tv({
  slots: {
    positioner: ['z-50'],
    popup: [
      'rounded-platform-control border border-platform-tooltip-line bg-platform-tooltip px-2 py-1',
      'font-medium text-platform-12 leading-normal whitespace-nowrap text-platform-tooltip-text',
      'shadow-platform-lg',
    ],
  },
});
