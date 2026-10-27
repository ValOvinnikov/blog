import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES, routes } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import { NextIntlClientProvider } from 'next-intl';

import { SmartLink } from './smart-link';

faker.seed(5601);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_INTERNAL_HREF = routes.landingPage(faker.lorem.slug());
const MOCK_EXTERNAL_HREF = faker.internet.url();
const MOCK_PROTOCOL_RELATIVE_HREF = `//${faker.internet.domainName()}/${faker.lorem.slug()}`;
const NEW_TAB_REL = 'noopener noreferrer';

const setup = customRender(SmartLink, {
  href: MOCK_INTERNAL_HREF,
  children: MOCK_LABEL,
});

describe(`<${SmartLink.name}/>`, () => {
  it('links an internal href without target or rel', () => {
    setup();

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute('href', MOCK_INTERNAL_HREF);
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('prefixes an internal href with a non-default language', () => {
    renderElement(
      <NextIntlClientProvider locale={LOCALE_ISO_CODES.NL} messages={{}}>
        <SmartLink href={MOCK_INTERNAL_HREF}>{MOCK_LABEL}</SmartLink>
      </NextIntlClientProvider>,
    );

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute(
      'href',
      `/${LOCALE_BCP47_TAGS.NL}${MOCK_INTERNAL_HREF}`,
    );
  });

  it.each([
    { kind: 'an absolute external', href: MOCK_EXTERNAL_HREF },
    { kind: 'a protocol-relative', href: MOCK_PROTOCOL_RELATIVE_HREF },
  ])('keeps $kind href and adds rel for a new tab', ({ href }) => {
    setup({ href, target: '_blank' });

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', NEW_TAB_REL);
  });

  it('keeps the href when prefetch is disabled', () => {
    setup({ prefetch: false });

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute('href', MOCK_INTERNAL_HREF);
  });
});
