import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { SETTINGS_FORM_STACK } from '@platform/constants/settings-form';
import { TOAST_TEST_ID } from '@platform/constants/toast';
import {
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import {
  ALL_CHANGES_SAVED,
  ARCHIVED_NOTICE_ID,
  ARCHIVED_NOTICE_TEXT,
  ONE_UNSAVED_CHANGE,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  MOCK_ARCHIVED_AT,
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';

import {
  SettingsFormShell,
  type TSettingsFormShellProps,
} from './settings-form-shell';
import type { TSettingsForm } from './settings-form-types';

type TValues = { tagline: string; footer: string };

faker.seed(5995);

const MOCK_SAVED_VALUES: TValues = {
  tagline: faker.lorem.sentence(),
  footer: faker.lorem.sentence(),
};
const MOCK_DRAFT_TAGLINE = faker.lorem.sentence();
const MOCK_THEIR_TAGLINE = faker.lorem.sentence();
const MOCK_TAGLINE_LABEL = faker.lorem.word();
const MOCK_FOOTER_FIELD_ID = faker.lorem.word();
const MOCK_FOOTER_LABEL = faker.lorem.words(2);
const MOCK_PAGE = faker.lorem.word();
const MOCK_DRAFT_SAVED_AT = new Date('2026-10-08T11:05:00.000Z');
const MOCK_TITLE = faker.lorem.word();
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_BODY = faker.lorem.sentence();
const MOCK_REMOVE_LABEL = faker.lorem.words(2);
const MOCK_ERROR_TITLE = faker.lorem.sentence();
const MOCK_PLAN_REFUSAL = faker.lorem.sentence();
const MOCK_EDITED_VALUES: TValues = {
  ...MOCK_SAVED_VALUES,
  tagline: MOCK_DRAFT_TAGLINE,
};
const MOCK_THEIR_VALUES: TValues = {
  ...MOCK_SAVED_VALUES,
  tagline: MOCK_THEIR_TAGLINE,
};

const draftFor = (
  values: TValues,
  savedValues: TValues = MOCK_SAVED_VALUES,
  onRestore: (values: TValues) => void = vi.fn(),
): TSettingsForm<TValues>['draft'] => ({
  tenantId: MOCK_TENANT_ID,
  page: MOCK_PAGE,
  values,
  savedValues,
  savedAt: MOCK_DRAFT_SAVED_AT,
  fields: [
    { id: 'tagline', label: MOCK_TAGLINE_LABEL, display: (v) => v.tagline },
    {
      id: MOCK_FOOTER_FIELD_ID,
      label: MOCK_FOOTER_LABEL,
      display: (v) => v.footer,
    },
  ],
  onRestore,
});

const baseSave = vi.fn().mockResolvedValue(true);

const formFor = (
  overrides: Partial<TSettingsForm<TValues>> = {},
): TSettingsForm<TValues> => ({
  save: baseSave,
  discard: vi.fn(),
  changeCount: 0,
  changesByLanguage: [],
  invalidControls: undefined,
  isPending: false,
  isArchived: Boolean(overrides.archivedAt),
  archivedAt: undefined,
  archivedNoticeId: ARCHIVED_NOTICE_ID,
  draft: draftFor(MOCK_SAVED_VALUES),
  ...overrides,
});

const baseProps: TSettingsFormShellProps<TValues> = {
  title: MOCK_TITLE,
  description: MOCK_DESCRIPTION,
  form: formFor(),
  children: <p>{MOCK_BODY}</p>,
};

const renderShell = (
  form: Partial<TSettingsForm<TValues>> = {},
  overrides: Partial<TSettingsFormShellProps<TValues>> = {},
) =>
  renderWithIntl(
    <SettingsFormShell {...baseProps} form={formFor(form)} {...overrides} />,
  );

const dispatchBeforeUnload = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

const THREE_UNSAVED_CHANGES = '3 unsaved changes';
const RESTORE_1_CHANGE = 'Restore 1 change';
const DISCARD = 'Discard';
const UNSAVED_CHANGES_ANNOUNCEMENT_TEST_ID = 'unsaved-changes-announcement';

const TaglineSettings = ({
  hasSavedStatus,
  layout,
}: Pick<TSettingsFormShellProps<TValues>, 'hasSavedStatus' | 'layout'>) => {
  const [saved, setSaved] = useState(MOCK_SAVED_VALUES);
  const [values, setValues] = useState(MOCK_SAVED_VALUES);

  return (
    <SettingsFormShell
      {...baseProps}
      hasSavedStatus={hasSavedStatus}
      layout={layout}
      form={formFor({
        changeCount: values.tagline === saved.tagline ? 0 : 1,
        save: async () => {
          setSaved(values);
          return true;
        },
        discard: () => setValues(saved),
        draft: draftFor(values, saved),
      })}
    >
      <label>
        {MOCK_TAGLINE_LABEL}
        <input
          value={values.tagline}
          onChange={(event) =>
            setValues({ ...values, tagline: event.target.value })
          }
        />
      </label>
    </SettingsFormShell>
  );
};

const RemovableControl = () => {
  const [isShown, setIsShown] = useState(true);

  return (
    isShown && (
      <button type="button" onClick={() => setIsShown(false)}>
        {MOCK_REMOVE_LABEL}
      </button>
    )
  );
};

const getTaglineInput = () =>
  screen.getByRole('textbox', { name: MOCK_TAGLINE_LABEL });

const editTagline = async (user: UserEvent) => {
  await user.type(getTaglineInput(), '!');
};

describe(`<${SettingsFormShell.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with no unsaved changes', () => {
    let onSave: TSettingsForm<TValues>['save'];

    beforeEach(() => {
      onSave = vi.fn().mockResolvedValue(true);
      renderShell({ save: onSave });
    });

    it('renders the title, description and children', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_TITLE,
      });
      const description = screen.getByText(MOCK_DESCRIPTION);
      const body = screen.getByText(MOCK_BODY);

      expect(heading).toBeVisible();
      expect(description).toBeVisible();
      expect(body).toBeVisible();
    });

    it('shows no archived notice when the tenant is not archived', () => {
      const archivedNotice = screen.queryByText(ARCHIVED_NOTICE_TEXT);

      expect(archivedNotice).not.toBeInTheDocument();
    });

    it('shows no error alert without an error title', () => {
      const errorAlert = screen.queryByRole('alert');

      expect(errorAlert).not.toBeInTheDocument();
    });

    it('shows no save status and offers no save bar', () => {
      const savedStatus = screen.queryByText(ALL_CHANGES_SAVED);
      const saveBar = screen.queryByRole('region', { name: UNSAVED_CHANGES });

      expect(savedStatus).not.toBeInTheDocument();
      expect(saveBar).not.toBeInTheDocument();
    });

    it('ignores the save shortcut', async () => {
      await user.keyboard(USER_EVENT_KEY.CONTROL_S);

      expect(onSave).not.toHaveBeenCalled();
    });

    it('lets the page unload without a warning', () => {
      const event = dispatchBeforeUnload();

      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('with unsaved changes', () => {
    let onSave: TSettingsForm<TValues>['save'];
    let onDiscard: TSettingsForm<TValues>['discard'];

    beforeEach(() => {
      onSave = vi.fn().mockResolvedValue(true);
      onDiscard = vi.fn();
      renderShell({ save: onSave, discard: onDiscard, changeCount: 3 });
    });

    it('shows the save bar with the change count in place of the saved status', () => {
      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const savedStatus = screen.queryByText(ALL_CHANGES_SAVED);

      expect(saveBar).toHaveTextContent(THREE_UNSAVED_CHANGES);
      expect(savedStatus).not.toBeInTheDocument();
    });

    it('announces the change count politely', () => {
      const announcement = screen.getByTestId(
        UNSAVED_CHANGES_ANNOUNCEMENT_TEST_ID,
      );

      expect(announcement).toHaveAttribute('role', 'status');
      expect(announcement).toHaveTextContent(THREE_UNSAVED_CHANGES);
    });

    it('calls onSave from the Save button', async () => {
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('calls onDiscard from the Discard button', async () => {
      const discardButton = screen.getByRole('button', { name: DISCARD });
      await user.click(discardButton);

      expect(onDiscard).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['Ctrl+S', USER_EVENT_KEY.CONTROL_S],
      ['⌘S', '{Meta>}s{/Meta}'],
    ])('saves on %s', async (_, keys) => {
      await user.keyboard(keys);

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('warns before the page unloads', () => {
      const event = dispatchBeforeUnload();

      expect(event.defaultPrevented).toBe(true);
    });

    it('never moves focus into the save bar', () => {
      expect(document.body).toHaveFocus();
    });
  });

  describe('with the save bar hidden by the page', () => {
    let onSave: TSettingsForm<TValues>['save'];
    let rerender: ReturnType<typeof renderShell>['rerender'];

    beforeEach(() => {
      onSave = vi.fn().mockResolvedValue(true);
      ({ rerender } = renderShell(
        { save: onSave, changeCount: 3 },
        { isSaveBarHidden: true },
      ));
    });

    it('offers no save bar', () => {
      const saveBar = screen.queryByRole('region', { name: UNSAVED_CHANGES });

      expect(saveBar).not.toBeInTheDocument();
    });

    it('still saves on the shortcut', async () => {
      await user.keyboard(USER_EVENT_KEY.CONTROL_S);

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('still warns before the page unloads and announces the change count', () => {
      const event = dispatchBeforeUnload();
      const announcement = screen.getByTestId(
        UNSAVED_CHANGES_ANNOUNCEMENT_TEST_ID,
      );

      expect(event.defaultPrevented).toBe(true);
      expect(announcement).toHaveTextContent(THREE_UNSAVED_CHANGES);
    });

    it('shows the bar again with its count once the page stops hiding it', () => {
      rerender(
        <SettingsFormShell
          {...baseProps}
          form={formFor({ save: onSave, changeCount: 3 })}
        />,
      );

      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });

      expect(saveBar).toHaveTextContent(THREE_UNSAVED_CHANGES);
    });
  });

  describe('saved status', () => {
    beforeEach(async () => {
      renderWithIntl(<TaglineSettings />);
      await editTagline(user);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);
    });

    it('shows after a successful save', async () => {
      const savedStatus = await screen.findByText(ALL_CHANGES_SAVED);

      expect(savedStatus).toBeVisible();
    });

    describe('then edited again', () => {
      beforeEach(async () => {
        await screen.findByText(ALL_CHANGES_SAVED);
        await editTagline(user);
      });

      it('disappears on the next edit after a save', () => {
        const savedStatus = screen.queryByText(ALL_CHANGES_SAVED);

        expect(savedStatus).not.toBeInTheDocument();
      });

      it('stays hidden after discarding back to clean', async () => {
        const discardButton = screen.getByRole('button', { name: DISCARD });
        await user.click(discardButton);

        const saveBar = screen.queryByRole('region', { name: UNSAVED_CHANGES });
        const savedStatus = screen.queryByText(ALL_CHANGES_SAVED);

        expect(saveBar).not.toBeInTheDocument();
        expect(savedStatus).not.toBeInTheDocument();
      });
    });
  });

  it('shows no saved status after a save when the page opts out of it', async () => {
    renderWithIntl(<TaglineSettings hasSavedStatus={false} />);
    await editTagline(user);
    const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
    await user.click(saveButton);

    await waitFor(() => {
      const saveBar = screen.queryByRole('region', { name: UNSAVED_CHANGES });
      expect(saveBar).not.toBeInTheDocument();
    });
    const savedStatus = screen.queryByText(ALL_CHANGES_SAVED);

    expect(savedStatus).not.toBeInTheDocument();
  });

  it('does not save from the shortcut while a save is pending', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    renderShell({ save: onSave, changeCount: 1, isPending: true });

    await user.keyboard(USER_EVENT_KEY.CONTROL_S);

    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows the archived notice when the tenant is archived', () => {
    renderShell({ archivedAt: MOCK_ARCHIVED_AT });

    const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);

    expect(archivedNotice).toBeVisible();
  });

  it('offers no save bar to an archived tenant', () => {
    renderShell({ archivedAt: MOCK_ARCHIVED_AT, changeCount: 3 });

    const saveBar = screen.queryByRole('region', { name: UNSAVED_CHANGES });

    expect(saveBar).not.toBeInTheDocument();
  });

  describe('with the phone save footer', () => {
    const phoneFooterLayout = { layout: { hasPhoneSaveFooter: true } };

    it('keeps the footer saying all changes are saved with no unsaved changes', () => {
      renderShell({}, phoneFooterLayout);

      const footer = screen.getByRole('region', { name: ALL_CHANGES_SAVED });
      const saveBar = screen.queryByRole('region', { name: UNSAVED_CHANGES });

      expect(footer).toBeVisible();
      expect(saveBar).not.toBeInTheDocument();
    });

    it('offers Discard only in the docked bar, never in the footer', () => {
      renderShell({ changeCount: 3 }, phoneFooterLayout);

      const footer = screen.getByRole('region', {
        name: THREE_UNSAVED_CHANGES,
      });
      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const footerDiscard = within(footer).queryByRole('button', {
        name: DISCARD,
      });
      const barDiscard = within(saveBar).getByRole('button', { name: DISCARD });

      expect(footerDiscard).not.toBeInTheDocument();
      expect(barDiscard).toBeVisible();
    });

    it('offers no footer to an archived tenant', () => {
      renderShell({ archivedAt: MOCK_ARCHIVED_AT }, phoneFooterLayout);

      const footer = screen.queryByRole('region', { name: ALL_CHANGES_SAVED });

      expect(footer).not.toBeInTheDocument();
    });
  });

  describe('a failed save', () => {
    describe('while changes remain', () => {
      beforeEach(() => {
        renderShell({ changeCount: 3 }, { errorTitle: MOCK_ERROR_TITLE });
      });

      it('shows its message in the save bar in place of the change count', () => {
        const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
        const errorAlert = within(saveBar).getByRole('alert');

        expect(errorAlert).toHaveTextContent(MOCK_ERROR_TITLE);
        expect(saveBar).not.toHaveTextContent(THREE_UNSAVED_CHANGES);
      });

      it('announces its message once, from the save bar', () => {
        const errorAlerts = screen.getAllByRole('alert');

        expect(errorAlerts).toHaveLength(1);
      });
    });

    it('withdraws its message while the next save is in flight', () => {
      renderShell(
        { changeCount: 3, isPending: true, planRefusal: MOCK_PLAN_REFUSAL },
        { errorTitle: MOCK_ERROR_TITLE },
      );

      const errorAlert = screen.queryByRole('alert');

      expect(errorAlert).not.toBeInTheDocument();
    });

    it('shows its message at the top of the page when no save bar shows', () => {
      renderShell({}, { errorTitle: MOCK_ERROR_TITLE });

      const errorAlert = screen.getByRole('alert');
      const saveBar = screen.queryByRole('region', { name: UNSAVED_CHANGES });

      expect(errorAlert).toHaveTextContent(MOCK_ERROR_TITLE);
      expect(saveBar).not.toBeInTheDocument();
    });

    it('shows a plan refusal in the save bar while changes remain', () => {
      renderShell(
        { changeCount: 1, planRefusal: MOCK_PLAN_REFUSAL },
        { errorTitle: MOCK_ERROR_TITLE },
      );

      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const errorAlert = within(saveBar).getByRole('alert');

      expect(errorAlert).toHaveTextContent(MOCK_PLAN_REFUSAL);
    });

    describe('a plan refusal once no changes remain', () => {
      let rerender: ReturnType<typeof renderShell>['rerender'];

      beforeEach(() => {
        ({ rerender } = renderShell({ planRefusal: MOCK_PLAN_REFUSAL }));
      });

      it('shows as a toast, not on the page', () => {
        const toasts = screen.getByTestId(TOAST_TEST_ID.VIEWPORT);
        const errorAlert = screen.getByRole('alert');

        expect(errorAlert).toHaveTextContent(MOCK_PLAN_REFUSAL);
        expect(toasts).toContainElement(errorAlert);
      });

      it('stays until it is dismissed by keyboard', async () => {
        await user.keyboard(USER_EVENT_KEY.ESCAPE);

        await waitFor(() => {
          const errorAlert = screen.queryByRole('alert');

          expect(errorAlert).not.toBeInTheDocument();
        });
      });

      it('goes once the next save is in flight', async () => {
        rerender(
          <SettingsFormShell
            {...baseProps}
            form={formFor({ changeCount: 1, isPending: true })}
          />,
        );

        await waitFor(() => {
          const errorAlert = screen.queryByRole('alert');

          expect(errorAlert).not.toBeInTheDocument();
        });
      });
    });
  });

  it('keeps the title in the accessibility tree with every layout opt-in', () => {
    renderShell(
      {},
      {
        layout: {
          isWide: true,
          isTitleHiddenBelowLg: true,
          stack: SETTINGS_FORM_STACK.VOICE,
        },
      },
    );

    const heading = screen.getByRole('heading', { level: 1, name: MOCK_TITLE });

    expect(heading).toBeInTheDocument();
  });

  describe('draft recovery', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const leaveWithUnsavedChanges = (values: TValues = MOCK_EDITED_VALUES) => {
      const { unmount } = renderShell({
        changeCount: 1,
        draft: draftFor(values),
      });
      unmount();
    };

    const BANNER_TEXT = /You have unsaved changes from/;
    const queryBanner = () => screen.queryByText(BANNER_TEXT);
    const expectNoBanner = () => {
      const banner = queryBanner();

      expect(banner).not.toBeInTheDocument();
    };
    const expectNoBannerAfterRemount = (unmount: () => void) => {
      unmount();
      renderShell();
      expectNoBanner();
    };

    it('offers no draft on a first visit', () => {
      renderShell();

      expectNoBanner();
    });

    describe('after leaving with unsaved changes', () => {
      beforeEach(() => {
        leaveWithUnsavedChanges();
      });

      describe('on return', () => {
        let unmount: ReturnType<typeof renderShell>['unmount'];

        beforeEach(() => {
          ({ unmount } = renderShell());
        });

        it('offers to restore the unsaved changes on return', () => {
          const banner = screen.getByText(BANNER_TEXT);
          const keptNote = screen.getByText(
            'They were kept on this device when you left the page.',
          );
          const restoreButton = screen.getByRole('button', {
            name: RESTORE_1_CHANGE,
          });

          expect(banner).toBeVisible();
          expect(keptNote).toBeVisible();
          expect(restoreButton).toBeVisible();
        });

        it('forgets the draft when it is discarded from the banner', async () => {
          const discardButton = screen.getByRole('button', {
            name: 'Discard them',
          });
          await user.click(discardButton);
          expectNoBanner();

          expectNoBannerAfterRemount(unmount);
        });
      });

      it('restores exactly the unsaved changes and closes the banner', async () => {
        const onRestore = vi.fn();
        renderShell({
          draft: draftFor(MOCK_SAVED_VALUES, MOCK_SAVED_VALUES, onRestore),
        });

        const restoreButton = screen.getByRole('button', {
          name: RESTORE_1_CHANGE,
        });
        await user.click(restoreButton);
        const banner = queryBanner();

        expect(onRestore).toHaveBeenCalledWith(MOCK_EDITED_VALUES);
        expect(banner).not.toBeInTheDocument();
      });

      it('offers nothing when the draft matches what is saved now', () => {
        renderShell({
          draft: draftFor(MOCK_EDITED_VALUES, MOCK_EDITED_VALUES),
        });

        expectNoBanner();
      });

      it('keeps drafts apart per tenant', () => {
        renderShell({
          draft: {
            ...draftFor(MOCK_SAVED_VALUES),
            tenantId: MOCK_OTHER_TENANT_ID,
          },
        });

        expectNoBanner();
      });

      it('keeps drafts apart per language', () => {
        renderShell({
          draft: {
            ...draftFor(MOCK_SAVED_VALUES),
            language: LOCALE_ISO_CODES.DE,
          },
        });

        expectNoBanner();
      });

      describe('when someone else saved since', () => {
        let onRestore: (values: TValues) => void;

        beforeEach(() => {
          onRestore = vi.fn();
          renderShell({
            draft: draftFor(MOCK_THEIR_VALUES, MOCK_THEIR_VALUES, onRestore),
          });
        });

        it('says the page was saved after the draft was taken', () => {
          const staleNote = screen.getByText(/but this page was saved at/);

          expect(staleNote).toBeVisible();
        });

        it('names the fields a restore would overwrite before any restore', () => {
          const overwriteNote = screen.getByText(
            `Restoring replaces 1 of the newer values: ${MOCK_TAGLINE_LABEL}.`,
          );
          const restoreButton = screen.queryByRole('button', {
            name: RESTORE_1_CHANGE,
          });

          expect(overwriteNote).toBeVisible();
          expect(restoreButton).not.toBeInTheDocument();
          expect(onRestore).not.toHaveBeenCalled();
        });

        it('shows the saved value beside the draft for each differing field', async () => {
          const reviewToggle = screen.getByText('Review the difference');
          await user.click(reviewToggle);

          const row = screen.getByRole('row', {
            name: new RegExp(MOCK_TAGLINE_LABEL),
          });
          const savedCell = within(row).getByRole('cell', {
            name: MOCK_THEIR_TAGLINE,
          });
          const draftCell = within(row).getByRole('cell', {
            name: MOCK_DRAFT_TAGLINE,
          });

          expect(savedCell).toBeVisible();
          expect(draftCell).toBeVisible();
        });

        it('restores the draft on Restore anyway', async () => {
          const restoreAnywayButton = screen.getByRole('button', {
            name: 'Restore anyway',
          });
          await user.click(restoreAnywayButton);

          expect(onRestore).toHaveBeenCalledWith(MOCK_EDITED_VALUES);
        });

        it('forgets the draft on Discard my draft', async () => {
          const discardDraftButton = screen.getByRole('button', {
            name: 'Discard my draft',
          });
          await user.click(discardDraftButton);
          expectNoBanner();
          expect(onRestore).not.toHaveBeenCalled();
        });
      });
    });

    describe('with unsaved changes on the page', () => {
      let unmount: ReturnType<typeof renderShell>['unmount'];

      beforeEach(() => {
        ({ unmount } = renderShell({
          changeCount: 1,
          draft: draftFor(MOCK_EDITED_VALUES),
        }));
      });

      it('forgets the draft once the changes are saved', async () => {
        const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
        await user.click(saveButton);
        await waitFor(() => expect(baseSave).toHaveBeenCalledTimes(1));
        unmount();
        renderShell();
        expectNoBanner();
      });

      it('forgets the draft once the changes are discarded', async () => {
        const discardButton = screen.getByRole('button', { name: DISCARD });
        await user.click(discardButton);
        unmount();
        renderShell();
        expectNoBanner();
      });
    });

    it('still works as a form when storage is blocked', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      const onSave = vi.fn().mockResolvedValue(true);
      const { unmount } = renderShell({
        save: onSave,
        changeCount: 1,
        draft: draftFor(MOCK_EDITED_VALUES),
      });

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      expect(onSave).toHaveBeenCalledTimes(1);

      unmount();
      renderShell();
      expectNoBanner();
    });
  });

  describe('focus after a save', () => {
    const saveFrom = async (regionName: string) => {
      const region = screen.getByRole('region', { name: regionName });
      const saveButton = within(region).getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveButton);
      return saveButton;
    };

    it('returns to the last control after a save from the save bar', async () => {
      renderWithIntl(<TaglineSettings />);
      await editTagline(user);

      await saveFrom(UNSAVED_CHANGES);

      await waitFor(() => expect(getTaglineInput()).toHaveFocus());
    });

    it('returns to the last control after a save from the phone footer', async () => {
      renderWithIntl(<TaglineSettings layout={{ hasPhoneSaveFooter: true }} />);
      await editTagline(user);

      await saveFrom(ONE_UNSAVED_CHANGE);

      await waitFor(() => expect(getTaglineInput()).toHaveFocus());
    });

    it('moves to the page heading when the last control has left the page', async () => {
      renderShell({ changeCount: 1 }, { children: <RemovableControl /> });
      const removeButton = screen.getByRole('button', {
        name: MOCK_REMOVE_LABEL,
      });
      await user.click(removeButton);

      await saveFrom(UNSAVED_CHANGES);

      const heading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_TITLE,
      });
      await waitFor(() => expect(heading).toHaveFocus());
    });

    it('leaves focus where it was after a save from the shortcut', async () => {
      renderWithIntl(<TaglineSettings />);
      await editTagline(user);

      await user.keyboard(USER_EVENT_KEY.CONTROL_S);

      await screen.findByText(ALL_CHANGES_SAVED);
      expect(getTaglineInput()).toHaveFocus();
    });

    it('stays on Save changes after a failed save', async () => {
      renderShell({ changeCount: 1, save: vi.fn().mockResolvedValue(false) });

      const saveButton = await saveFrom(UNSAVED_CHANGES);

      expect(saveButton).toHaveFocus();
    });
  });
});
