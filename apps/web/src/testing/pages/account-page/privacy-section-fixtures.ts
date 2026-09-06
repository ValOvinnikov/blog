import type { IPrivacySectionProps } from '@web/components/pages/account-page/sections/privacy-section';

export const makePrivacySection = (
  overrides: Partial<IPrivacySectionProps> = {},
): IPrivacySectionProps => {
  return {
    handle: 'jane',
    heading: 'Privacy',
    exportLabel: 'Export my data',
    exportDescription:
      'Download your profile and bookmarks as a single JSON archive.',
    exportButton: 'Request export',
    deleteLabel: 'Delete account',
    deleteDescription:
      'Irreversible. Your profile and bookmarks are erased and every session is signed out. Type your handle to arm the button.',
    ...overrides,
  };
};
