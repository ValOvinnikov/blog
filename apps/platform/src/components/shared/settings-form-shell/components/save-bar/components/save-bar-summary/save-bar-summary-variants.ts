import { saveBarLinkClasses } from '@platform/components/shared/settings-form-shell/components/save-bar/save-bar-variants';
import { tv } from '@platform/utils/tv/tv';

export const saveBarSummaryVariants = tv({
  slots: {
    summary: [
      'inline-flex flex-wrap items-center gap-2 text-platform-13',
      'md:gap-2.5 md:text-platform-13-5 md:leading-4',
    ],
    count: ['font-bold md:font-semibold'],
    breakdown: ['text-platform-muted'],
    errorContent: [
      'flex flex-col gap-1 md:min-w-0 md:flex-1 md:gap-0',
      'lg:flex-row lg:items-center lg:gap-2.5',
    ],
    errorCount: [
      'text-platform-14 font-semibold text-platform-bad',
      'md:text-platform-13-5 md:leading-5 lg:text-platform-13 lg:leading-4',
    ],
    errorFollowUp: [
      'flex items-center gap-1.5 text-platform-13 whitespace-nowrap md:leading-platform-18',
      'lg:contents',
    ],
    errorLink: [...saveBarLinkClasses, 'lg:leading-4'],
    separator: ['text-platform-muted lg:hidden'],
    notSaved: ['text-platform-muted lg:ml-auto lg:text-platform-12-5'],
  },
});
