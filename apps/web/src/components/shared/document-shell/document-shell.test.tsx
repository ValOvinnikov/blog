import { faker } from '@faker-js/faker';
import { themeBootstrapScript } from '@web/config/theme-script';
import { SANITY_IMAGE_CDN_PRECONNECT_TEST_ID } from '@web/constants/document-shell';
import { renderElement, within } from '@web/testing/custom-render';

import { DocumentShell } from './document-shell';

faker.seed(6007);

const MOCK_CONTENT = faker.lorem.sentence();
const MOCK_LANGUAGE = faker.location.countryCode().toLowerCase();
const SANITY_IMAGE_CDN_ORIGIN = 'https://cdn.sanity.io';

describe(`<${DocumentShell.name}/>`, () => {
  beforeEach(() => {
    renderElement(
      <DocumentShell lang={MOCK_LANGUAGE}>
        <div>{MOCK_CONTENT}</div>
      </DocumentShell>,
    );
  });

  it('declares the given language on the document', () => {
    expect(document.documentElement).toHaveAttribute('lang', MOCK_LANGUAGE);
  });

  it('mounts children in the body', () => {
    const content = within(document.body).getByText(MOCK_CONTENT);

    expect(content).toBeVisible();
  });

  it('runs the theme bootstrap script from the head', () => {
    const script = within(document.head).getByText(themeBootstrapScript, {
      ignore: false,
    });

    expect(script).toBeInstanceOf(HTMLScriptElement);
  });

  it('preconnects to the Sanity image CDN without crossorigin', () => {
    const preconnect = within(document.head).getByTestId(
      SANITY_IMAGE_CDN_PRECONNECT_TEST_ID,
    );

    expect(preconnect).toHaveAttribute('rel', 'preconnect');
    expect(preconnect).toHaveAttribute('href', SANITY_IMAGE_CDN_ORIGIN);
    expect(preconnect).not.toHaveAttribute('crossorigin');
  });
});
