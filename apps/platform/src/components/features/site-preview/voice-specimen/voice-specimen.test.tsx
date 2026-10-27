import { SITE_MESSAGES_BY_LOCALE, VOICE_SURFACE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import de from '@platform/i18n/messages/de.json';
import en from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  MOCK_BRAND_PRIMARY,
  MOCK_SITE_PREVIEW_THEME,
} from '@platform/testing/site-preview-theme';
import {
  buildVoiceDraft,
  withVoiceValue,
} from '@platform/utils/voice-draft/voice-draft';

import { VoiceSpecimen } from './voice-specimen';

const { EN, DE } = LOCALE_ISO_CODES;

faker.seed(5994);

const MOCK_DRAFT_HEADING = faker.lorem.words(3);
const DATA_FOCUSED = 'data-focused';

const defaults = buildVoiceDraft({}, [EN, DE]);

const valuesFor = (
  locale: typeof EN | typeof DE,
  overrides: Record<string, string> = {},
) => {
  const draft = Object.entries(overrides).reduce(
    (current, [id, value]) =>
      withVoiceValue(current, locale, id as 'notFoundHeading', value),
    defaults,
  );
  return draft[locale]!;
};

const setup = customRender(VoiceSpecimen, {
  surface: VOICE_SURFACE.NOT_FOUND,
  locale: EN,
  values: valuesFor(EN),
  listSamples: en.voiceSpecimen.lists,
  theme: MOCK_SITE_PREVIEW_THEME,
});

describe(`<${VoiceSpecimen.name}/>`, () => {
  it("renders the 404 from the language's defaults, with its fixed action", () => {
    setup();

    const { notFound } = SITE_MESSAGES_BY_LOCALE.EN;
    const eyebrow = screen.getByText(notFound.eyebrow);
    const heading = screen.getByText(notFound.heading);
    const supportingText = screen.getByText(notFound.supportingText);
    const homeLink = screen.getByRole('link', { name: notFound.returnHome });

    expect(eyebrow).toBeVisible();
    expect(heading).toBeVisible();
    expect(supportingText).toBeVisible();
    expect(homeLink).toBeVisible();
  });

  it('shows a draft value in place of the default', () => {
    setup({ values: valuesFor(EN, { notFoundHeading: MOCK_DRAFT_HEADING }) });

    const draftHeading = screen.getByText(MOCK_DRAFT_HEADING);
    const defaultHeading = screen.queryByText(
      SITE_MESSAGES_BY_LOCALE.EN.notFound.heading,
    );

    expect(draftHeading).toBeVisible();
    expect(defaultHeading).not.toBeInTheDocument();
  });

  it("labels the error page's actions in the selected language", () => {
    setup({
      surface: VOICE_SURFACE.ERROR,
      locale: DE,
      values: valuesFor(DE),
      listSamples: de.voiceSpecimen.lists,
    });

    const { localeErrorPage } = SITE_MESSAGES_BY_LOCALE.DE;
    const title = screen.getByText(localeErrorPage.title);
    const retryButton = screen.getByRole('button', {
      name: localeErrorPage.retry,
    });
    const homeLink = screen.getByRole('link', { name: localeErrorPage.goHome });

    expect(title).toBeVisible();
    expect(retryButton).toBeVisible();
    expect(homeLink).toBeVisible();
  });

  it('shows only the open list, with its name filled from a sample', () => {
    setup({ surface: VOICE_SURFACE.ARCHIVE, openListFieldId: 'topicEmpty' });

    const openList = screen.getByText(
      `No posts in ${en.voiceSpecimen.lists.topic.heading} yet.`,
    );
    const closedList = screen.queryByText(
      SITE_MESSAGES_BY_LOCALE.EN.blogListPage.empty,
    );

    expect(openList).toBeVisible();
    expect(closedList).not.toBeInTheDocument();
  });

  it('renders the empty bookmarks message inside the saved posts panel', () => {
    setup({ surface: VOICE_SURFACE.BOOKMARKS });

    const { bookmarksPage } = SITE_MESSAGES_BY_LOCALE.EN;
    const title = screen.getByText(bookmarksPage.title);
    const listHeading = screen.getByText(bookmarksPage.listHeading);
    const empty = screen.getByText(bookmarksPage.empty);

    expect(title).toBeVisible();
    expect(listHeading).toBeVisible();
    expect(empty).toBeVisible();
  });

  it('outlines only the focused field', () => {
    setup({ focusedFieldId: 'notFoundHeading' });

    const focusedField = screen.getByTestId('voice-key-notFoundHeading');
    const otherField = screen.getByTestId('voice-key-notFoundSupportingText');

    expect(focusedField).toHaveAttribute(DATA_FOCUSED, 'true');
    expect(otherField).toHaveAttribute(DATA_FOCUSED, 'false');
  });

  it('applies the tenant theme to the specimen', () => {
    setup();

    const heading = screen.getByText(
      SITE_MESSAGES_BY_LOCALE.EN.notFound.heading,
    );
    const brandPrimary =
      getComputedStyle(heading).getPropertyValue('--brand-primary');

    expect(brandPrimary).toBe(MOCK_BRAND_PRIMARY);
  });
});
