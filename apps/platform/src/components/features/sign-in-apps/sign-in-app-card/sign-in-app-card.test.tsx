import { ACTION_OUTCOME } from '@blog/config';
import { OAUTH_PROVIDER } from '@blog/config/constants';
import en from '@platform/i18n/messages/en.json';
import { confirmSignInCallbackAction } from '@platform/server/sign-in-apps/confirm-sign-in-callback-action';
import { removeSignInAppAction } from '@platform/server/sign-in-apps/remove-sign-in-app-action';
import { saveSignInAppAction } from '@platform/server/sign-in-apps/save-sign-in-app-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_CLIENT_ID,
  MOCK_CLIENT_SECRET,
  MOCK_MASKED_CLIENT_ID,
  MOCK_REPLACEMENT_CLIENT_ID,
  mockSignInAppView,
} from '@platform/testing/sign-in-apps/fixtures';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SignInAppCard } from './sign-in-app-card';

vi.mock('@platform/server/sign-in-apps/save-sign-in-app-action');
vi.mock('@platform/server/sign-in-apps/remove-sign-in-app-action');
vi.mock('@platform/server/sign-in-apps/confirm-sign-in-callback-action');

const page = en.signInAppsPage;
const t = makeEnTranslator('signInAppsPage');
const GOOGLE = page.providerName.google;
const SAVE_NAME = t('save', { provider: GOOGLE });
const OWN_APP = mockSignInAppView({
  hasOwnApp: true,
  clientId: MOCK_CLIENT_ID,
  maskedClientId: MOCK_MASKED_CLIENT_ID,
});

const setup = customRender(SignInAppCard, {
  tenantId: MOCK_TENANT_ID,
  app: mockSignInAppView(),
  domain: MOCK_CUSTOM_DOMAIN,
});

const PASSWORD_TYPE = 'password';
const clientIdInput = () =>
  screen.getByRole('textbox', { name: page.clientIdLabel });
const secretInput = () => screen.getByLabelText(page.clientSecretLabel);
const button = (name: string) => screen.getByRole('button', { name });
const queryButton = (name: string) => screen.queryByRole('button', { name });

describe(`<${SignInAppCard.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    vi.mocked(saveSignInAppAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    vi.mocked(removeSignInAppAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    vi.mocked(confirmSignInCallbackAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
  });

  describe('on the shared app', () => {
    beforeEach(() => {
      setup();
    });

    it('shows Save and no Remove', () => {
      const save = button(SAVE_NAME);
      const remove = queryButton(page.remove);

      expect(save).toBeVisible();
      expect(remove).not.toBeInTheDocument();
    });

    it('marks each empty field invalid, links its error and saves nothing', async () => {
      const save = button(SAVE_NAME);

      await user.click(save);

      const clientId = clientIdInput();
      const secret = secretInput();
      expect(clientId).toBeInvalid();
      expect(clientId).toHaveAccessibleDescription(
        expect.stringContaining(page.fieldError.clientIdRequired),
      );
      expect(secret).toBeInvalid();
      expect(saveSignInAppAction).not.toHaveBeenCalled();
    });

    it('hides the secret being typed until Show, keeping focus on the toggle', async () => {
      const secret = secretInput();
      const show = button(page.showClientSecret);
      await user.type(secret, MOCK_CLIENT_SECRET);

      expect(secret).toHaveAttribute('type', PASSWORD_TYPE);
      expect(show).not.toBePressed();

      await user.click(show);

      const hide = button(page.hideClientSecret);
      expect(secret).not.toHaveAttribute('type', PASSWORD_TYPE);
      expect(hide).toBePressed();
      expect(hide).toHaveFocus();
    });

    it('saves both fields, then shows the own app with the secret set', async () => {
      const clientId = clientIdInput();
      const secret = secretInput();
      const save = button(SAVE_NAME);
      await user.type(clientId, MOCK_CLIENT_ID);
      await user.type(secret, MOCK_CLIENT_SECRET);

      await user.click(save);

      const saved = await screen.findByText(t('saved', { provider: GOOGLE }));
      const pill = screen.getByText(page.ownStatus);
      const savedSecret = secretInput();
      const saveAfter = queryButton(SAVE_NAME);
      expect(saveSignInAppAction).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        provider: OAUTH_PROVIDER.GOOGLE,
        clientId: MOCK_CLIENT_ID,
        clientSecret: MOCK_CLIENT_SECRET,
      });
      expect(saved).toBeVisible();
      expect(pill).toBeVisible();
      expect(savedSecret).toHaveValue(page.secretSet);
      expect(saveAfter).not.toBeInTheDocument();
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('keeps what was typed and shows the failure when the server fails', async () => {
      vi.mocked(saveSignInAppAction).mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      const clientId = clientIdInput();
      const secret = secretInput();
      const save = button(SAVE_NAME);
      await user.type(clientId, MOCK_CLIENT_ID);
      await user.type(secret, MOCK_CLIENT_SECRET);

      await user.click(save);

      const failure = await screen.findByText(page.saveFailed);
      expect(failure).toBeVisible();
      expect(clientId).toHaveValue(MOCK_CLIENT_ID);
      expect(secret).toHaveValue(MOCK_CLIENT_SECRET);
    });

    it('links out to the provider console', () => {
      const link = screen.getByRole('link', {
        name: new RegExp(page.consoleLink.google),
      });

      expect(link).toBeVisible();
    });
  });

  describe('on the owner’s app', () => {
    beforeEach(() => {
      setup({ app: OWN_APP });
    });

    it('shows Remove and no Save until a field changes', () => {
      const remove = button(page.remove);
      const save = queryButton(SAVE_NAME);

      expect(remove).toBeVisible();
      expect(save).not.toBeInTheDocument();
    });

    it('masks the client ID until Show, then lets it change without a new secret', async () => {
      const clientId = clientIdInput();
      const show = button(page.showClientId);
      expect(clientId).toHaveValue(MOCK_MASKED_CLIENT_ID);

      await user.click(show);
      await user.clear(clientId);
      await user.type(clientId, MOCK_REPLACEMENT_CLIENT_ID);
      const save = button(SAVE_NAME);
      await user.click(save);

      expect(saveSignInAppAction).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        provider: OAUTH_PROVIDER.GOOGLE,
        clientId: MOCK_REPLACEMENT_CLIENT_ID,
        clientSecret: undefined,
      });
    });

    it('swaps Set for an empty secret field on Replace and restores it on Cancel', async () => {
      const replace = button(page.replace);
      const secret = secretInput();

      await user.click(replace);

      const save = button(SAVE_NAME);
      expect(secret).toHaveValue('');
      expect(secret).toHaveFocus();
      expect(save).toBeVisible();

      await user.click(replace);

      expect(secret).toHaveValue(page.secretSet);
    });

    it('returns to the shared app after Remove is confirmed', async () => {
      const remove = button(page.remove);
      await user.click(remove);
      const confirm = await screen.findByRole('button', {
        name: page.removeDialog.confirm,
      });

      await user.click(confirm);

      const shared = await screen.findByText(page.sharedStatus);
      const clientId = clientIdInput();
      const title = screen.getByRole('heading', { level: 2 });
      expect(removeSignInAppAction).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        OAUTH_PROVIDER.GOOGLE,
      );
      expect(shared).toBeVisible();
      expect(clientId).toHaveValue('');
      expect(title).toHaveFocus();
    });
  });

  describe('after the main address changed', () => {
    const WARNING = t('callbackWarning', {
      domain: MOCK_CUSTOM_DOMAIN,
      provider: GOOGLE,
    });

    beforeEach(() => {
      setup({ app: { ...OWN_APP, hasCallbackWarning: true } });
    });

    it('warns until the owner confirms, then focuses Copy', async () => {
      const warning = screen.getByText(WARNING);
      const confirm = button(page.callbackConfirm);
      const copy = button(page.copy);
      expect(warning).toBeVisible();

      await user.click(confirm);

      expect(confirmSignInCallbackAction).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        OAUTH_PROVIDER.GOOGLE,
      );
      expect(warning).not.toBeInTheDocument();
      expect(copy).toHaveFocus();
    });
  });
});
