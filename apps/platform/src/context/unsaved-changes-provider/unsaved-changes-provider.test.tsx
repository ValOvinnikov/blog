import { GuardedLink } from '@platform/components/shared/guarded-link';
import { useRouter } from '@platform/i18n/base-navigation';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import {
  UnsavedChangesProvider,
  useUnsavedChangesGuard,
  type TUnsavedChangesGuard,
} from './unsaved-changes-provider';

vi.mock('@platform/i18n/base-navigation');

const { push } = vi.mocked(useRouter)();

const Page = ({ guard }: { guard: TUnsavedChangesGuard | null }) => {
  useUnsavedChangesGuard(guard);
  return <GuardedLink href="/elsewhere">Elsewhere</GuardedLink>;
};

const renderPage = (guard: TUnsavedChangesGuard | null) =>
  renderWithIntl(
    <UnsavedChangesProvider>
      <Page guard={guard} />
    </UnsavedChangesProvider>,
  );

const buildGuard = (
  overrides: Partial<TUnsavedChangesGuard> = {},
): TUnsavedChangesGuard => ({
  pageTitle: 'Voice',
  changeCount: 2,
  save: vi.fn().mockResolvedValue(true),
  discard: vi.fn(),
  ...overrides,
});

describe(UnsavedChangesProvider, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('lets an in-app link navigate when nothing is unsaved', async () => {
    renderPage(null);

    await user.click(screen.getByRole('link', { name: 'Elsewhere' }));

    expect(push).toHaveBeenCalledWith('/elsewhere');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  describe('with unsaved changes', () => {
    let guard: TUnsavedChangesGuard;

    beforeEach(async () => {
      guard = buildGuard();
      renderPage(guard);
      await user.click(screen.getByRole('link', { name: 'Elsewhere' }));
    });

    it('asks before an in-app link navigates', () => {
      expect(
        screen.getByRole('alertdialog', { name: 'Leave without saving?' }),
      ).toHaveAccessibleDescription('You have 2 unsaved changes on Voice.');
      expect(push).not.toHaveBeenCalled();
    });

    it('stays on the page on Stay', async () => {
      await user.click(screen.getByRole('button', { name: 'Stay' }));

      await waitFor(() =>
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      expect(push).not.toHaveBeenCalled();
      expect(guard.discard).not.toHaveBeenCalled();
    });

    it('discards and navigates on Discard and leave', async () => {
      await user.click(
        screen.getByRole('button', { name: 'Discard and leave' }),
      );

      expect(guard.discard).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith('/elsewhere');
    });

    it('navigates after a successful save on Save and leave', async () => {
      await user.click(screen.getByRole('button', { name: 'Save and leave' }));

      await waitFor(() => expect(push).toHaveBeenCalledWith('/elsewhere'));
      expect(guard.save).toHaveBeenCalledTimes(1);
    });
  });

  it('stays on the page when Save and leave fails to save', async () => {
    const guard = buildGuard({ save: vi.fn().mockResolvedValue(false) });
    renderPage(guard);

    await user.click(screen.getByRole('link', { name: 'Elsewhere' }));
    await user.click(screen.getByRole('button', { name: 'Save and leave' }));

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('names the changes per language when the page gives a breakdown', async () => {
    renderPage(
      buildGuard({
        changeCount: 3,
        changesByLanguage: [
          { language: 'English', count: 2 },
          { language: 'Deutsch', count: 1 },
        ],
      }),
    );

    await user.click(screen.getByRole('link', { name: 'Elsewhere' }));

    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription(
      'You have 3 unsaved changes on Voice — English 2 · Deutsch 1.',
    );
  });
});
