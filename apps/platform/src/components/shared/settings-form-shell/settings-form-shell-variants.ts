import { SETTINGS_FORM_STACK } from '@platform/constants/settings-form';
import { tv } from '@platform/utils/tv/tv';

export const settingsFormShellVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-6',
      'md:[html:has(&)]:scroll-pb-[calc(var(--admin-save-bar-height,var(--spacing-admin-dock))+var(--spacing-admin-dock-clearance))]',
    ],
    alert: ['w-fit'],
    liveStatus: ['sr-only'],
  },
  variants: {
    isWide: {
      false: { root: ['max-w-3xl'] },
    },
    stack: {
      [SETTINGS_FORM_STACK.LOOK]: { root: ['gap-admin-form-gap'] },
      [SETTINGS_FORM_STACK.VOICE]: {
        // The content column's 16px phone padding less 2: the board's 14.
        root: ['gap-4 max-md:-mt-0.5 md:gap-5'],
      },
    },
    hasPhoneSaveFooter: {
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
          'md:pb-[calc(max(var(--spacing-admin-dock-room),var(--admin-save-bar-height,0px)+var(--spacing-admin-dock-room)-var(--spacing-admin-dock))-var(--spacing-admin-content))]',
        ],
      },
    },
  },
  compoundVariants: [
    {
      hasPhoneSaveFooter: false,
      isSaveBarShown: true,
      class: {
        root: [
          'max-md:pb-[calc(max(var(--spacing-admin-dock-room),var(--admin-save-bar-height,0px)+var(--spacing-admin-dock-clearance))-(--spacing(4)))]',
          'max-md:[html:has(&)]:scroll-pb-[max(var(--spacing-admin-dock-room),var(--admin-save-bar-height,0px)+var(--spacing-admin-dock-clearance))]',
        ],
      },
    },
    {
      hasPhoneSaveFooter: false,
      isSaveBarShown: false,
      class: {
        root: ['max-md:pb-[calc(--spacing(6)-(--spacing(4)))]'],
      },
    },
    {
      hasPhoneSaveFooter: true,
      isArchived: false,
      class: {
        root: [
          'max-md:pb-[calc(max(var(--spacing-admin-phone-footer-room),var(--admin-save-bar-height,0px)+var(--spacing-admin-phone-footer-room)-var(--spacing-admin-phone-footer-max))-(--spacing(4)))]',
          'max-md:[html:has(&)]:scroll-pb-[calc(var(--admin-save-bar-height,var(--spacing-admin-phone-footer-max))+var(--spacing-admin-dock-clearance))]',
        ],
      },
    },
    {
      hasPhoneSaveFooter: true,
      isArchived: true,
      class: {
        root: [
          'max-md:pb-[calc(var(--spacing-admin-archived-room)-(--spacing(4)))]',
        ],
      },
    },
  ],
  defaultVariants: {
    isWide: false,
    isArchived: false,
    hasPhoneSaveFooter: false,
    isSaveBarShown: false,
  },
});
