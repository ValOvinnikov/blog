import { SITE_MESSAGES_BY_LOCALE, VOICE_SURFACE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  buildVoiceDraft,
  withVoiceValue,
} from '@platform/utils/voice-draft/voice-draft';
import type { CSSProperties } from 'react';

import { VoiceSpecimen } from './voice-specimen';

const { EN, DE } = LOCALE_ISO_CODES;

const render = renderWithIntl;

const THEME = {
  tokenStyle: { '--brand-primary': 'oklch(0.53 0.17 28)' } as CSSProperties,
  isDark: false,
  headingFontFamily: 'mock-heading-font',
  bodyFontFamily: 'mock-body-font',
};

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

describe(VoiceSpecimen, () => {
  it("renders the 404 from the language's defaults, with its fixed action", () => {
    render(
      <VoiceSpecimen
        surface={VOICE_SURFACE.NOT_FOUND}
        locale={EN}
        values={valuesFor(EN)}
        theme={THEME}
      />,
    );

    const { notFound } = SITE_MESSAGES_BY_LOCALE.EN;
    expect(screen.getByText(notFound.eyebrow)).toBeVisible();
    expect(screen.getByText(notFound.heading)).toBeVisible();
    expect(screen.getByText(notFound.supportingText)).toBeVisible();
    expect(
      screen.getByRole('link', { name: notFound.returnHome }),
    ).toBeVisible();
  });

  it('shows a draft value in place of the default', () => {
    render(
      <VoiceSpecimen
        surface={VOICE_SURFACE.NOT_FOUND}
        locale={EN}
        values={valuesFor(EN, { notFoundHeading: 'Lost at sea' })}
        theme={THEME}
      />,
    );

    expect(screen.getByText('Lost at sea')).toBeVisible();
    expect(
      screen.queryByText(SITE_MESSAGES_BY_LOCALE.EN.notFound.heading),
    ).not.toBeInTheDocument();
  });

  it("labels the error page's actions in the selected language", () => {
    render(
      <VoiceSpecimen
        surface={VOICE_SURFACE.ERROR}
        locale={DE}
        values={valuesFor(DE)}
        theme={THEME}
      />,
    );

    const { localeErrorPage } = SITE_MESSAGES_BY_LOCALE.DE;
    expect(screen.getByText(localeErrorPage.title)).toBeVisible();
    expect(
      screen.getByRole('button', { name: localeErrorPage.retry }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: localeErrorPage.goHome }),
    ).toBeVisible();
  });

  it('shows only the open list, with its name filled from a sample', () => {
    render(
      <VoiceSpecimen
        surface={VOICE_SURFACE.ARCHIVE}
        locale={EN}
        values={valuesFor(EN)}
        openListFieldId="topicEmpty"
        theme={THEME}
      />,
    );

    expect(screen.getByText('No posts in Design yet.')).toBeVisible();
    expect(
      screen.queryByText(SITE_MESSAGES_BY_LOCALE.EN.blogListPage.empty),
    ).not.toBeInTheDocument();
  });

  it('renders the empty bookmarks message inside the saved posts panel', () => {
    render(
      <VoiceSpecimen
        surface={VOICE_SURFACE.BOOKMARKS}
        locale={EN}
        values={valuesFor(EN)}
        theme={THEME}
      />,
    );

    const { bookmarksPage } = SITE_MESSAGES_BY_LOCALE.EN;
    expect(
      screen.getByRole('heading', { name: bookmarksPage.title }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: bookmarksPage.listHeading }),
    ).toBeVisible();
    expect(screen.getByText(bookmarksPage.empty)).toBeVisible();
  });

  it('outlines only the focused field', () => {
    render(
      <VoiceSpecimen
        surface={VOICE_SURFACE.NOT_FOUND}
        locale={EN}
        values={valuesFor(EN)}
        focusedFieldId="notFoundHeading"
        theme={THEME}
      />,
    );

    expect(screen.getByTestId('voice-key-notFoundHeading')).toHaveAttribute(
      'data-focused',
      'true',
    );
    expect(
      screen.getByTestId('voice-key-notFoundSupportingText'),
    ).toHaveAttribute('data-focused', 'false');
  });

  it('applies the tenant theme and fonts to the specimen', () => {
    render(
      <VoiceSpecimen
        surface={VOICE_SURFACE.NOT_FOUND}
        locale={EN}
        values={valuesFor(EN)}
        theme={THEME}
      />,
    );

    const heading = screen.getByText(
      SITE_MESSAGES_BY_LOCALE.EN.notFound.heading,
    );
    const style = getComputedStyle(heading);
    expect(style.getPropertyValue('--brand-primary')).toBe(
      'oklch(0.53 0.17 28)',
    );
    expect(style.getPropertyValue('--font-display')).toBe('mock-heading-font');
  });
});
