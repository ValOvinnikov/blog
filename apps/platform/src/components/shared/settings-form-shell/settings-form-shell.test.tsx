import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import {
  ALL_CHANGES_SAVED,
  ARCHIVED_NOTICE_ID,
  ARCHIVED_NOTICE_TEXT,
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
import type { TSettingsForm } from './use-settings-form';

type TValues = { tagline: string; footer: string };

faker.seed(5995);

const MOCK_SAVED_VALUES: TValues = {
  tagline: faker.lorem.sentence(),
  footer: faker.lorem.sentence(),
};
const MOCK_DRAFT_TAGLINE = faker.lorem.sentence();
const MOCK_THEIR_TAGLINE = faker.lorem.sentence();
const MOCK_TAGLINE_LABEL = faker.lorem.word();
const MOCK_FOOTER_LABEL = faker.lorem.words(2);
const MOCK_PAGE = faker.lorem.word();
const MOCK_DRAFT_SAVED_AT = new Date('2026-10-08T11:05:00.000Z');
const MOCK_TITLE = faker.lorem.word();
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_BODY = faker.lorem.sentence();
const MOCK_ERROR_TITLE = faker.lorem.sentence();
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
    { id: 'footer', label: MOCK_FOOTER_LABEL, display: (v) => v.footer },
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

const CONTROL_S_CONTROL = '{Control>}s{/Control}';
const THREE_UNSAVED_CHANGES = '3 unsaved changes';
const RESTORE_1_CHANGE = 'Restore 1 change';
const DISCARD = 'Discard';
const UNSAVED_CHANGES_ANNOUNCEMENT_TEST_ID = 'unsaved-changes-announcement';

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
      await user.keyboard(CONTROL_S_CONTROL);

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
      ['Ctrl+S', CONTROL_S_CONTROL],
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

  describe('saved status', () => {
    const TaglineSettings = () => {
      const [saved, setSaved] = useState(MOCK_SAVED_VALUES);
      const [values, setValues] = useState(MOCK_SAVED_VALUES);

      return (
        <SettingsFormShell
          {...baseProps}
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

    const editTagline = async () => {
      const taglineInput = screen.getByRole('textbox', {
        name: MOCK_TAGLINE_LABEL,
      });
      await user.type(taglineInput, '!');
    };

    beforeEach(async () => {
      renderWithIntl(<TaglineSettings />);
      await editTagline();
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
        await editTagline();
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

  it('does not save from the shortcut while a save is pending', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    renderShell({ save: onSave, changeCount: 1, isPending: true });

    await user.keyboard(CONTROL_S_CONTROL);

    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows the archived notice when the tenant is archived', () => {
    renderShell({ archivedAt: MOCK_ARCHIVED_AT });

    const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);

    expect(archivedNotice).toBeVisible();
  });

  it('shows the error alert when an error title is set', () => {
    renderShell({}, { errorTitle: MOCK_ERROR_TITLE });

    const errorAlert = screen.getByText(MOCK_ERROR_TITLE);

    expect(errorAlert).toBeVisible();
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

    it('offers no draft on a first visit', () => {
      renderShell();

      const banner = queryBanner();

      expect(banner).not.toBeInTheDocument();
    });

    describe('after leaving with unsaved changes', () => {
      beforeEach(() => {
        leaveWithUnsavedChanges();
      });

      it('offers to restore the unsaved changes on return', () => {
        renderShell();

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

      it('forgets the draft when it is discarded from the banner', async () => {
        const { unmount } = renderShell();

        const discardButton = screen.getByRole('button', {
          name: 'Discard them',
        });
        await user.click(discardButton);
        const bannerAfterDiscard = queryBanner();

        expect(bannerAfterDiscard).not.toBeInTheDocument();

        unmount();
        renderShell();
        const bannerAfterRemount = queryBanner();

        expect(bannerAfterRemount).not.toBeInTheDocument();
      });

      it('offers nothing when the draft matches what is saved now', () => {
        renderShell({
          draft: draftFor(MOCK_EDITED_VALUES, MOCK_EDITED_VALUES),
        });

        const banner = queryBanner();

        expect(banner).not.toBeInTheDocument();
      });

      it('keeps drafts apart per tenant', () => {
        renderShell({
          draft: {
            ...draftFor(MOCK_SAVED_VALUES),
            tenantId: MOCK_OTHER_TENANT_ID,
          },
        });

        const banner = queryBanner();

        expect(banner).not.toBeInTheDocument();
      });

      it('keeps drafts apart per language', () => {
        renderShell({
          draft: {
            ...draftFor(MOCK_SAVED_VALUES),
            language: LOCALE_ISO_CODES.DE,
          },
        });

        const banner = queryBanner();

        expect(banner).not.toBeInTheDocument();
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
          const banner = queryBanner();

          expect(banner).not.toBeInTheDocument();
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
        const banner = queryBanner();

        expect(banner).not.toBeInTheDocument();
      });

      it('forgets the draft once the changes are discarded', async () => {
        const discardButton = screen.getByRole('button', { name: DISCARD });
        await user.click(discardButton);
        unmount();
        renderShell();
        const banner = queryBanner();

        expect(banner).not.toBeInTheDocument();
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
      const banner = queryBanner();

      expect(banner).not.toBeInTheDocument();
    });
  });
});
