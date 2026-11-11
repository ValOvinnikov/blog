import { SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { EMBED_PROVIDER_NAME } from '@web/constants/embed';
import { useConsentStore } from '@web/hooks/use-consent-store';
import { renderElement, screen, within } from '@web/testing/custom-render';
import { MOCK_CAL_EMBED, mockEmbed } from '@web/testing/modules/embed/fixtures';
import { AppProviders } from '@web/testing/providers';
import {
  clearConsentCookie,
  grantConsent,
  readGrantedConsent,
} from '@web/testing/shared/consent/consent-cookie';
import {
  COOKIE_SETTINGS_BUTTON_NAME,
  PREFERENCES_OPEN_TEXT,
  PreferencesState,
} from '@web/testing/shared/consent/consent-preferences-probes';
import { renderToString } from 'react-dom/server';

import { EmbedFrame } from './embed-frame';

faker.seed(3774);

const ALLOW_BUTTON_NAME = SITE_MESSAGES.consent.placeholder.allowLabel;
const FORMS_SANDBOX_TOKEN = 'allow-forms';
const MOCK_CAPTION = faker.lorem.sentence();
const MOCK_WITHDRAW_BUTTON_NAME = faker.lorem.words(2);

const MOCK_EMBED = mockEmbed({ caption: MOCK_CAPTION });

const WithdrawButton = () => {
  const { rejectAll } = useConsentStore();
  return <button onClick={rejectAll}>{MOCK_WITHDRAW_BUTTON_NAME}</button>;
};

const frames = (
  <>
    <EmbedFrame embed={MOCK_EMBED} />
    <EmbedFrame embed={MOCK_CAL_EMBED} />
    <PreferencesState />
    <WithdrawButton />
  </>
);

describe(`<${EmbedFrame.name}/>`, () => {
  afterEach(clearConsentCookie);

  describe('before external media is allowed', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      renderElement(frames);
    });

    it('names the provider and the embed in the placeholder', () => {
      const provider = screen.getByText(
        EMBED_PROVIDER_NAME[MOCK_EMBED.provider],
      );
      const title = screen.getByText(MOCK_EMBED.title);

      expect(provider).toBeVisible();
      expect(title).toBeVisible();
    });

    it('loads nothing from the provider', () => {
      const player = screen.queryByTitle(MOCK_EMBED.title);

      expect(player).not.toBeInTheDocument();
    });

    it('renders the caption inside the figure', () => {
      const [figure] = screen.getAllByRole('figure');
      const caption = within(figure as HTMLElement).getByText(MOCK_CAPTION);

      expect(caption).toBeVisible();
    });

    it('opens the cookie settings from the placeholder', async () => {
      const [settingsButton] = screen.getAllByRole('button', {
        name: COOKIE_SETTINGS_BUTTON_NAME,
      });

      await user.click(settingsButton as HTMLElement);

      const openState = screen.getByText(PREFERENCES_OPEN_TEXT);
      expect(openState).toBeVisible();
    });

    describe('when Allow is pressed', () => {
      beforeEach(async () => {
        const [allowButton] = screen.getAllByRole('button', {
          name: ALLOW_BUTTON_NAME,
        });
        await user.click(allowButton as HTMLElement);
      });

      it('swaps in every player on the page without a reload', () => {
        const booking = screen.getByTitle(MOCK_CAL_EMBED.title);
        const player = screen.getByTitle(MOCK_EMBED.title);

        expect(player).toHaveAttribute('src', MOCK_EMBED.embedUrl);
        expect(booking).toHaveAttribute('src', MOCK_CAL_EMBED.embedUrl);
        expect(readGrantedConsent()).toHaveLength(1);
      });

      it('moves focus to the player that replaced the pressed button', () => {
        const player = screen.getByTitle(MOCK_EMBED.title);

        expect(player).toHaveFocus();
      });
    });
  });

  describe('once external media is allowed', () => {
    beforeEach(() => {
      grantConsent();
    });

    describe('on load', () => {
      let user: UserEvent;

      beforeEach(() => {
        user = userEvent.setup();
        renderElement(frames);
      });

      it('shows the player without moving focus to it', () => {
        const player = screen.getByTitle(MOCK_EMBED.title);

        expect(player).toHaveAttribute('src', MOCK_EMBED.embedUrl);
        expect(player).not.toHaveFocus();
      });

      it('lets only the booking embed submit forms', () => {
        const booking = screen.getByTitle(MOCK_CAL_EMBED.title);
        const player = screen.getByTitle(MOCK_EMBED.title);

        expect(booking.getAttribute('sandbox')).toContain(FORMS_SANDBOX_TOKEN);
        expect(player.getAttribute('sandbox')).not.toContain(
          FORMS_SANDBOX_TOKEN,
        );
      });

      it('removes the player once consent is withdrawn', async () => {
        const withdrawButton = screen.getByRole('button', {
          name: MOCK_WITHDRAW_BUTTON_NAME,
        });

        await user.click(withdrawButton);

        const player = screen.queryByTitle(MOCK_EMBED.title);
        expect(player).not.toBeInTheDocument();
      });
    });

    it('renders no provider iframe on the server, before consent is read', () => {
      const html = renderToString(<AppProviders>{frames}</AppProviders>);

      expect(html).not.toContain(MOCK_EMBED.embedUrl);
      expect(html).not.toContain(MOCK_CAL_EMBED.embedUrl);
    });
  });
});
