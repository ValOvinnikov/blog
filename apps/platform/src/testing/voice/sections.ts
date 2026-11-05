import en from '@platform/i18n/messages/en.json';
import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

export const ERROR_PAGES_SECTION = en.voiceSections.ERROR_PAGES;
export const EMPTY_STATES_SECTION = en.voiceSections.EMPTY_STATES;

export const voiceSectionHeader = (name: string) =>
  screen.getByRole('button', { name: new RegExp(`^${name}`) });

export const openVoiceSections = async (user: UserEvent) => {
  await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));
  await user.click(voiceSectionHeader(EMPTY_STATES_SECTION));
};
