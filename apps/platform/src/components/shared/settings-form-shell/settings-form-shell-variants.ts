import { tv } from '@platform/utils/tv/tv';

export const settingsFormShellVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-6',
      'md:[html:has(&)]:scroll-pb-[calc(var(--spacing-admin-dock)+var(--spacing-admin-dock-clearance))]',
    ],
    alert: ['w-fit'],
    liveStatus: ['sr-only'],
  },
  variants: {
    isWide: {
      false: { root: ['max-w-3xl'] },
    },
    hasCompactGap: {
      true: { root: ['gap-admin-form-gap'] },
    },
    isSaveBarFloatingOnPhone: {
      true: {},
      false: {},
    },
    isSaveBarShown: {
      true: {},
      false: {},
    },
    isArchived: {
      true: {
        root: [
          'md:pb-[calc(var(--spacing-admin-archived-room)-var(--spacing-admin-content))]',
        ],
      },
      false: {
        root: [
          'md:pb-[calc(var(--spacing-admin-dock-room)-var(--spacing-admin-content))]',
        ],
      },
    },
  },
  compoundVariants: [
    {
      isSaveBarFloatingOnPhone: false,
      isSaveBarShown: true,
      class: {
        root: [
          'max-md:pb-[calc(var(--spacing-admin-dock-room)-(--spacing(4)))]',
          'max-md:[html:has(&)]:scroll-pb-admin-dock-room',
        ],
      },
    },
    {
      isSaveBarFloatingOnPhone: false,
      isSaveBarShown: false,
      class: {
        root: ['max-md:pb-[calc(--spacing(6)-(--spacing(4)))]'],
      },
    },
  ],
  defaultVariants: {
    isWide: false,
    hasCompactGap: false,
    isArchived: false,
    isSaveBarFloatingOnPhone: false,
    isSaveBarShown: false,
  },
});
