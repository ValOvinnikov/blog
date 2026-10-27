import { ACTION_OUTCOME, routes, SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, screen, waitFor } from '@web/testing/custom-render';
import { withToastProvider } from '@web/testing/providers';
import { useRouter } from 'next/navigation';

import { ProviderLinkControl } from './provider-link-control';

faker.seed(6007);

const { routerRefreshMock, signInMock, unlinkProviderActionMock } = vi.hoisted(
  () => ({
    routerRefreshMock: vi.fn(),
    signInMock: vi.fn(),
    unlinkProviderActionMock: vi.fn(),
  }),
);

vi.mocked(useRouter).mockReturnValue({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: routerRefreshMock,
} as unknown as ReturnType<typeof useRouter>);

vi.mock('next-auth/react', () => ({ signIn: signInMock }));

vi.mock('@web/server/account/identity-actions/identity-actions', () => ({
  unlinkProviderAction: unlinkProviderActionMock,
}));

const PROVIDER = 'github';
const {
  linkButton: LINK_LABEL,
  unlinkButton: UNLINK_LABEL,
  unlinkToastSuccessMessage: UNLINK_SUCCESS_MESSAGE,
  unlinkError: UNLINK_ERROR_MESSAGE,
  unlinkLastMethodError: LAST_METHOD_ERROR_MESSAGE,
} = SITE_MESSAGES.accountPage.identity;

const setup = customRender(withToastProvider(ProviderLinkControl), {
  provider: PROVIDER,
  action: 'link',
});

describe(`<${ProviderLinkControl.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    routerRefreshMock.mockReset();
    signInMock.mockReset();
    unlinkProviderActionMock.mockReset();
    user = userEvent.setup();
  });

  describe('link action', () => {
    beforeEach(() => {
      setup();
    });

    it('starts the provider sign-in that returns to the account page', async () => {
      signInMock.mockResolvedValue(undefined);
      const linkButton = screen.getByRole('button', { name: LINK_LABEL });

      await user.click(linkButton);

      expect(signInMock).toHaveBeenCalledWith(PROVIDER, {
        redirectTo: routes.account(),
      });
    });

    it('marks the button aria-busy only while the link is pending', async () => {
      let resolveSignIn!: () => void;
      signInMock.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveSignIn = resolve;
          }),
      );
      const linkButton = screen.getByRole('button', { name: LINK_LABEL });

      await user.click(linkButton);
      expect(linkButton).toHaveAttribute('aria-busy', 'true');

      resolveSignIn();

      await waitFor(() => {
        expect(linkButton).toHaveAttribute('aria-busy', 'false');
      });
    });
  });

  describe('unlink action', () => {
    beforeEach(() => {
      setup({ action: 'unlink' });
    });

    it('unlinks the provider, announces it and refreshes the page', async () => {
      unlinkProviderActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      const unlinkButton = screen.getByRole('button', { name: UNLINK_LABEL });

      await user.click(unlinkButton);

      const successToast = await screen.findByRole('status');

      expect(successToast).toHaveTextContent(UNLINK_SUCCESS_MESSAGE);
      expect(unlinkProviderActionMock).toHaveBeenCalledWith(PROVIDER);
      expect(routerRefreshMock).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        reason: 'unlinking fails',
        outcome: ACTION_OUTCOME.SERVER_ERROR,
        message: UNLINK_ERROR_MESSAGE,
      },
      {
        reason: 'the server rejects the last remaining method',
        outcome: ACTION_OUTCOME.BLOCKED,
        message: LAST_METHOD_ERROR_MESSAGE,
      },
    ])(
      'explains the refusal and keeps the page when $reason',
      async ({ outcome, message }) => {
        unlinkProviderActionMock.mockResolvedValue({ outcome });
        const unlinkButton = screen.getByRole('button', { name: UNLINK_LABEL });

        await user.click(unlinkButton);

        const errorToast = await screen.findByRole('alert');

        expect(errorToast).toHaveTextContent(message);
        expect(routerRefreshMock).not.toHaveBeenCalled();
      },
    );
  });
});
