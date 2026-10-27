import type { TMaybeNull } from '@blog/config';
import { faker } from '@faker-js/faker';
import { GuardedLink } from '@platform/components/shared/guarded-link';
import { useRouter } from '@platform/i18n/base-navigation';
import {
  customRender,
  renderHook,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import {
  UnsavedChangesProvider,
  useInterceptNavigation,
  useUnsavedChangesGuard,
  type TUnsavedChangesGuard,
} from './unsaved-changes-provider';

vi.mock('@platform/i18n/base-navigation');

faker.seed(21);

const MOCK_PAGE_TITLE = faker.lorem.words(2);
const MOCK_LINK_LABEL = faker.lorem.word();
const MOCK_HREF = `/${faker.lorem.slug()}`;
const MOCK_CHANGE_COUNT = faker.number.int({ min: 2, max: 5 });
const MOCK_ENGLISH = faker.lorem.word();
const MOCK_GERMAN = faker.lorem.word();
const MOCK_LANGUAGES = [
  { language: MOCK_ENGLISH, count: 2 },
  { language: MOCK_GERMAN, count: 1 },
];
const MOCK_LANGUAGES_SUMMARY = `${MOCK_ENGLISH} 2 · ${MOCK_GERMAN} 1`;

const t = makeEnTranslator('leavePageDialog');

const { push } = vi.mocked(useRouter)();

const Page = ({ guard }: { guard: TMaybeNull<TUnsavedChangesGuard> }) => {
  useUnsavedChangesGuard(guard);
  return <GuardedLink href={MOCK_HREF}>{MOCK_LINK_LABEL}</GuardedLink>;
};

const setup = customRender(Page, { guard: null });

const mockGuard = (
  overrides: Partial<TUnsavedChangesGuard> = {},
): TUnsavedChangesGuard => ({
  pageTitle: MOCK_PAGE_TITLE,
  changeCount: MOCK_CHANGE_COUNT,
  save: vi.fn().mockResolvedValue(true),
  discard: vi.fn(),
  ...overrides,
});

describe(useUnsavedChangesGuard, () => {
  it('throws when a page registers a guard outside a provider', () => {
    expect(() => renderHook(() => useUnsavedChangesGuard(null))).toThrow(
      'useUnsavedChangesGuard must be used within an UnsavedChangesProvider',
    );
  });
});

describe(useInterceptNavigation, () => {
  it('throws when a link intercepts navigation outside a provider', () => {
    expect(() => renderHook(() => useInterceptNavigation())).toThrow(
      'useInterceptNavigation must be used within an UnsavedChangesProvider',
    );
  });
});

describe(`<${UnsavedChangesProvider.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('lets an in-app link navigate when nothing is unsaved', async () => {
    setup();
    const link = screen.getByRole('link', { name: MOCK_LINK_LABEL });

    await user.click(link);

    const dialog = screen.queryByRole('alertdialog');
    expect(push).toHaveBeenCalledWith(MOCK_HREF);
    expect(dialog).not.toBeInTheDocument();
  });

  describe('with unsaved changes', () => {
    let guard: TUnsavedChangesGuard;

    beforeEach(async () => {
      guard = mockGuard();
      setup({ guard });
      const link = screen.getByRole('link', { name: MOCK_LINK_LABEL });
      await user.click(link);
    });

    it('asks before an in-app link navigates', () => {
      const dialog = screen.getByRole('alertdialog', { name: t('title') });

      expect(dialog).toHaveAccessibleDescription(
        t('description', {
          count: MOCK_CHANGE_COUNT,
          page: MOCK_PAGE_TITLE,
        }),
      );
      expect(push).not.toHaveBeenCalled();
    });

    it('stays on the page on Stay', async () => {
      const dialog = screen.getByRole('alertdialog');
      const stayButton = screen.getByRole('button', { name: t('stay') });

      await user.click(stayButton);

      await waitFor(() => expect(dialog).not.toBeInTheDocument());
      expect(push).not.toHaveBeenCalled();
      expect(guard.discard).not.toHaveBeenCalled();
    });

    it('discards and navigates on Discard and leave', async () => {
      const discardButton = screen.getByRole('button', {
        name: t('discardAndLeave'),
      });

      await user.click(discardButton);

      expect(guard.discard).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith(MOCK_HREF);
    });

    it('navigates after a successful save on Save and leave', async () => {
      const saveButton = screen.getByRole('button', {
        name: t('saveAndLeave'),
      });

      await user.click(saveButton);

      await waitFor(() => expect(push).toHaveBeenCalledWith(MOCK_HREF));
      expect(guard.save).toHaveBeenCalledTimes(1);
    });
  });

  it('stays on the page when Save and leave fails to save', async () => {
    setup({ guard: mockGuard({ save: vi.fn().mockResolvedValue(false) }) });
    const link = screen.getByRole('link', { name: MOCK_LINK_LABEL });
    await user.click(link);
    const dialog = screen.getByRole('alertdialog');
    const saveButton = screen.getByRole('button', { name: t('saveAndLeave') });

    await user.click(saveButton);

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
  });

  it('names the changes per language when the page gives a breakdown', async () => {
    setup({
      guard: mockGuard({
        changeCount: MOCK_CHANGE_COUNT,
        changesByLanguage: MOCK_LANGUAGES,
      }),
    });
    const link = screen.getByRole('link', { name: MOCK_LINK_LABEL });

    await user.click(link);

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAccessibleDescription(
      t('descriptionByLanguage', {
        count: MOCK_CHANGE_COUNT,
        page: MOCK_PAGE_TITLE,
        languages: MOCK_LANGUAGES_SUMMARY,
      }),
    );
  });
});
