import { CONSENT_CATEGORY } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useConsent } from '@web/hooks/use-consent';
import { renderElement, screen } from '@web/testing/custom-render';
import { AppProviders } from '@web/testing/providers';
import {
  clearConsentCookie,
  grantConsent,
} from '@web/testing/shared/consent/consent-cookie';
import { renderToString } from 'react-dom/server';

import { ConsentGate } from './consent-gate';

faker.seed(3774);

const MOCK_FALLBACK_TEXT = faker.lorem.sentence();
const MOCK_PENDING_TEXT = faker.lorem.sentence();
const MOCK_CONTENT_TEXT = faker.lorem.sentence();
const MOCK_GRANT_BUTTON_NAME = faker.lorem.words(2);

const GrantButton = () => {
  const { grant } = useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA);
  return <button onClick={grant}>{MOCK_GRANT_BUTTON_NAME}</button>;
};

const gate = (
  <>
    <ConsentGate
      category={CONSENT_CATEGORY.EXTERNAL_MEDIA}
      fallback={<p>{MOCK_FALLBACK_TEXT}</p>}
      pending={<p>{MOCK_PENDING_TEXT}</p>}
    >
      <p>{MOCK_CONTENT_TEXT}</p>
    </ConsentGate>
    <GrantButton />
  </>
);

describe(`<${ConsentGate.name}/>`, () => {
  afterEach(clearConsentCookie);

  describe('while the category is unanswered', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      renderElement(gate);
    });

    it('renders the fallback and holds back the content', () => {
      const fallback = screen.getByText(MOCK_FALLBACK_TEXT);
      const content = screen.queryByText(MOCK_CONTENT_TEXT);

      expect(fallback).toBeVisible();
      expect(content).not.toBeInTheDocument();
    });

    it('swaps the fallback for the content without a reload once granted', async () => {
      const grantButton = screen.getByRole('button', {
        name: MOCK_GRANT_BUTTON_NAME,
      });

      await user.click(grantButton);

      const content = screen.getByText(MOCK_CONTENT_TEXT);
      const fallback = screen.queryByText(MOCK_FALLBACK_TEXT);
      expect(content).toBeVisible();
      expect(fallback).not.toBeInTheDocument();
    });
  });

  it.each([
    ['the fallback once the category is declined', [], MOCK_FALLBACK_TEXT],
    [
      'the content once the category is granted',
      [CONSENT_CATEGORY.EXTERNAL_MEDIA],
      MOCK_CONTENT_TEXT,
    ],
  ])('renders %s', (_, granted, text) => {
    grantConsent(granted);
    renderElement(gate);

    const shown = screen.getByText(text);

    expect(shown).toBeVisible();
  });

  it('renders only the pending state on the server, before consent is known', () => {
    grantConsent();

    const html = renderToString(<AppProviders>{gate}</AppProviders>);

    expect(html).toContain(MOCK_PENDING_TEXT);
    expect(html).not.toContain(MOCK_CONTENT_TEXT);
  });
});
