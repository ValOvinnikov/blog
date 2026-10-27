import {
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { setRequestLocale } from 'next-intl/server';
import type { ReactElement } from 'react';

import LocaleLayout, { generateStaticParams } from './layout';

faker.seed(5996);

type TAnyElement = ReactElement<Record<string, unknown>>;

const MOCK_CONTENT = faker.lorem.sentence();
const MOCK_UNSUPPORTED_LOCALE = 'PT';

const firstChildOf = (node: TAnyElement): TAnyElement =>
  [
    // eslint-disable-next-line testing-library/no-node-access -- a root layout returns <html>, which jsdom cannot mount, so its element props are read
    (node.props as { children: TAnyElement | TAnyElement[] }).children,
  ].flat()[0] as TAnyElement;

const defaultProps = {
  children: <p>{MOCK_CONTENT}</p>,
  params: Promise.resolve({ locale: LOCALE_ISO_CODES.EN }),
};

const setup = customRenderAsync(LocaleLayout, defaultProps);

describe(generateStaticParams, () => {
  it('returns params for every supported locale', () => {
    expect(generateStaticParams()).toEqual(
      Object.values(LOCALE_ISO_CODES).map((locale) => ({ locale })),
    );
  });
});

describe(`<${LocaleLayout.name}/>`, () => {
  it('404s on an unsupported locale without ever pinning it', async () => {
    await expect(
      setup({ params: Promise.resolve({ locale: MOCK_UNSUPPORTED_LOCALE }) }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(setRequestLocale).not.toHaveBeenCalled();
  });

  it('provides the messages for the requested locale', async () => {
    const htmlElement = await LocaleLayout(defaultProps);
    const provider = firstChildOf(firstChildOf(htmlElement as TAnyElement));

    expect(setRequestLocale).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
    expect(provider.props.locale).toBe(LOCALE_ISO_CODES.EN);
    expect(provider.props.messages).toEqual(messages);
  });

  it('declares the admin language on the document', async () => {
    const htmlElement = await LocaleLayout({
      ...defaultProps,
      params: Promise.resolve({ locale: LOCALE_ISO_CODES.NL }),
    });

    expect((htmlElement as TAnyElement).props.lang).toBe(LOCALE_BCP47_TAGS.NL);
  });

  it('renders its children', async () => {
    await setup();

    const content = screen.getByText(MOCK_CONTENT);

    expect(content).toBeVisible();
  });
});
