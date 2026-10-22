import { LOCALE_ISO_CODES } from '@blog/config';
import {
  fireEvent,
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';

import {
  SettingsFormShell,
  type TSettingsFormShellProps,
} from './settings-form-shell';
import type { TSettingsForm } from './use-settings-form';

type TValues = { tagline: string; footer: string };

const SAVED: TValues = { tagline: 'Old tagline', footer: 'Old footer' };

const draftFor = (
  values: TValues,
  savedValues: TValues = SAVED,
  onRestore: (values: TValues) => void = vi.fn(),
): TSettingsForm<TValues>['draft'] => ({
  tenantId: TENANT_ID,
  page: 'voice',
  values,
  savedValues,
  savedAt: new Date('2026-10-08T11:05:00.000Z'),
  fields: [
    { id: 'tagline', label: 'Tagline', display: (v) => v.tagline },
    { id: 'footer', label: 'Footer note', display: (v) => v.footer },
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
  archivedNoticeId: 'archived-notice',
  draft: draftFor(SAVED),
  ...overrides,
});

const TOGGLE_CAPABILITIES_FOR_THIS_TENANT =
  'Toggle capabilities for this tenant.';

const baseProps: TSettingsFormShellProps<TValues> = {
  title: 'Features',
  description: TOGGLE_CAPABILITIES_FOR_THIS_TENANT,
  form: formFor(),
  children: <p>tab body</p>,
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

const ALL_CHANGES_SAVED = 'All changes saved';
const UNSAVED_CHANGES = 'Unsaved changes';
const CONTROL_S_CONTROL = '{Control>}s{/Control}';
const THREE_UNSAVED_CHANGES = '3 unsaved changes';
const SAVE_CHANGES = 'Save changes';
const THIS_TENANT_IS_ARCHIVED = 'This tenant is archived';
const SOMETHING_WENT_WRONG_TRY_AGAIN = 'Something went wrong — try again.';
const MY_TAGLINE = 'My tagline';
const RESTORE_1_CHANGE = 'Restore 1 change';
const THEIR_TAGLINE = 'Their tagline';

describe(`<${SettingsFormShell.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders the title, description and children', () => {
    renderShell();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Features' }),
    ).toBeVisible();
    expect(screen.getByText(TOGGLE_CAPABILITIES_FOR_THIS_TENANT)).toBeVisible();
    expect(screen.getByText('tab body')).toBeVisible();
  });

  describe('with no unsaved changes', () => {
    let onSave: TSettingsForm<TValues>['save'];

    beforeEach(() => {
      onSave = vi.fn().mockResolvedValue(true);
      renderShell({ save: onSave });
    });

    it('shows no save status and offers no save bar', () => {
      expect(screen.queryByText(ALL_CHANGES_SAVED)).not.toBeInTheDocument();
      expect(
        screen.queryByRole('region', { name: UNSAVED_CHANGES }),
      ).not.toBeInTheDocument();
    });

    it('ignores the save shortcut', async () => {
      await user.keyboard(CONTROL_S_CONTROL);

      expect(onSave).not.toHaveBeenCalled();
    });

    it('lets the page unload without a warning', () => {
      expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
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
      expect(
        screen.getByRole('region', { name: UNSAVED_CHANGES }),
      ).toHaveTextContent(THREE_UNSAVED_CHANGES);
      expect(screen.queryByText(ALL_CHANGES_SAVED)).not.toBeInTheDocument();
    });

    it('announces the change count politely', () => {
      const announcement = screen.getByTestId('unsaved-changes-announcement');

      expect(announcement).toHaveAttribute('role', 'status');
      expect(announcement).toHaveTextContent(THREE_UNSAVED_CHANGES);
    });

    it('calls onSave from the Save button', async () => {
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('calls onDiscard from the Discard button', async () => {
      await user.click(screen.getByRole('button', { name: 'Discard' }));

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
      expect(dispatchBeforeUnload().defaultPrevented).toBe(true);
    });

    it('never moves focus into the save bar', () => {
      expect(document.body).toHaveFocus();
    });
  });

  describe('saved status', () => {
    const TaglineSettings = () => {
      const [saved, setSaved] = useState(SAVED);
      const [values, setValues] = useState(SAVED);

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
            Tagline
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

    const editTagline = () =>
      user.type(screen.getByRole('textbox', { name: 'Tagline' }), '!');

    it('shows after a successful save', async () => {
      renderWithIntl(<TaglineSettings />);

      await editTagline();
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      expect(await screen.findByText(ALL_CHANGES_SAVED)).toBeVisible();
    });

    it('disappears on the next edit after a save', async () => {
      renderWithIntl(<TaglineSettings />);
      await editTagline();
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));
      await screen.findByText(ALL_CHANGES_SAVED);

      await editTagline();

      expect(screen.queryByText(ALL_CHANGES_SAVED)).not.toBeInTheDocument();
    });

    it('stays hidden after discarding back to clean', async () => {
      renderWithIntl(<TaglineSettings />);
      await editTagline();
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));
      await screen.findByText(ALL_CHANGES_SAVED);
      await editTagline();

      await user.click(screen.getByRole('button', { name: 'Discard' }));

      expect(
        screen.queryByRole('region', { name: UNSAVED_CHANGES }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(ALL_CHANGES_SAVED)).not.toBeInTheDocument();
    });
  });

  it('does not save from the shortcut while a save is pending', () => {
    const onSave = vi.fn().mockResolvedValue(true);
    renderShell({ save: onSave, changeCount: 1, isPending: true });

    fireEvent.keyDown(window, { key: 's', ctrlKey: true });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows the archived notice when archivedAt is set', () => {
    renderShell({ archivedAt: new Date('2026-08-26T00:00:00.000Z') });

    expect(screen.getByText(THIS_TENANT_IS_ARCHIVED)).toBeVisible();
  });

  it('shows no archived notice when archivedAt is unset', () => {
    renderShell();

    expect(screen.queryByText(THIS_TENANT_IS_ARCHIVED)).not.toBeInTheDocument();
  });

  it('shows no error alert without an error title', () => {
    renderShell();

    expect(
      screen.queryByText(SOMETHING_WENT_WRONG_TRY_AGAIN),
    ).not.toBeInTheDocument();
  });

  it('shows the error alert when an error title is set', () => {
    renderShell({}, { errorTitle: SOMETHING_WENT_WRONG_TRY_AGAIN });

    expect(screen.getByText(SOMETHING_WENT_WRONG_TRY_AGAIN)).toBeVisible();
  });

  describe('draft recovery', () => {
    const EDITED: TValues = { ...SAVED, tagline: MY_TAGLINE };

    afterEach(() => {
      vi.restoreAllMocks();
    });

    const leaveWithUnsavedChanges = (values: TValues = EDITED) => {
      const { unmount } = renderShell({
        changeCount: 1,
        draft: draftFor(values),
      });
      unmount();
    };

    const queryBanner = () =>
      screen.queryByText(/You have unsaved changes from/);

    it('offers no draft on a first visit', () => {
      renderShell();

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('offers to restore exactly the unsaved changes on return', async () => {
      const onRestore = vi.fn();
      leaveWithUnsavedChanges();

      renderShell({ draft: draftFor(SAVED, SAVED, onRestore) });

      expect(queryBanner()).toBeVisible();
      expect(
        screen.getByText(
          'They were kept on this device when you left the page.',
        ),
      ).toBeVisible();
      await user.click(screen.getByRole('button', { name: RESTORE_1_CHANGE }));

      expect(onRestore).toHaveBeenCalledWith(EDITED);
      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('forgets the draft when it is discarded from the banner', async () => {
      leaveWithUnsavedChanges();
      const { unmount } = renderShell();

      await user.click(screen.getByRole('button', { name: 'Discard them' }));
      expect(queryBanner()).not.toBeInTheDocument();
      unmount();
      renderShell();

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('forgets the draft once the changes are saved', async () => {
      const { unmount } = renderShell({
        changeCount: 1,
        draft: draftFor(EDITED),
      });

      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));
      await waitFor(() => expect(baseSave).toHaveBeenCalled());
      unmount();
      renderShell();

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('forgets the draft once the changes are discarded', async () => {
      const { unmount } = renderShell({
        changeCount: 1,
        draft: draftFor(EDITED),
      });

      await user.click(screen.getByRole('button', { name: 'Discard' }));
      unmount();
      renderShell();

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('offers nothing when the draft matches what is saved now', () => {
      leaveWithUnsavedChanges();

      renderShell({ draft: draftFor(EDITED, EDITED) });

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('keeps drafts apart per tenant', () => {
      leaveWithUnsavedChanges();

      renderShell({ draft: { ...draftFor(SAVED), tenantId: 'tenant-2' } });

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('keeps drafts apart per language', () => {
      leaveWithUnsavedChanges();

      renderShell({
        draft: { ...draftFor(SAVED), language: LOCALE_ISO_CODES.DE },
      });

      expect(queryBanner()).not.toBeInTheDocument();
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
        draft: draftFor(EDITED),
      });

      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));
      expect(onSave).toHaveBeenCalledTimes(1);
      unmount();
      renderShell();

      expect(queryBanner()).not.toBeInTheDocument();
    });

    describe('when someone else saved since', () => {
      const THEIRS: TValues = { ...SAVED, tagline: THEIR_TAGLINE };
      let onRestore: (values: TValues) => void;

      beforeEach(() => {
        onRestore = vi.fn();
        leaveWithUnsavedChanges();
        renderShell({ draft: draftFor(THEIRS, THEIRS, onRestore) });
      });

      it('says the page was saved after the draft was taken', () => {
        expect(screen.getByText(/but this page was saved at/)).toBeVisible();
      });

      it('names the fields a restore would overwrite before any restore', () => {
        expect(
          screen.getByText(
            'Restoring replaces 1 of the newer values: Tagline.',
          ),
        ).toBeVisible();
        expect(
          screen.queryByRole('button', { name: RESTORE_1_CHANGE }),
        ).not.toBeInTheDocument();
        expect(onRestore).not.toHaveBeenCalled();
      });

      it('shows the saved value beside the draft for each differing field', async () => {
        await user.click(screen.getByText('Review the difference'));

        const row = screen.getByRole('row', { name: /Tagline/ });
        expect(
          within(row).getByRole('cell', { name: THEIR_TAGLINE }),
        ).toBeVisible();
        expect(
          within(row).getByRole('cell', { name: MY_TAGLINE }),
        ).toBeVisible();
      });

      it('restores the draft on Restore anyway', async () => {
        await user.click(
          screen.getByRole('button', { name: 'Restore anyway' }),
        );

        expect(onRestore).toHaveBeenCalledWith(EDITED);
      });

      it('forgets the draft on Discard my draft', async () => {
        await user.click(
          screen.getByRole('button', { name: 'Discard my draft' }),
        );

        expect(queryBanner()).not.toBeInTheDocument();
        expect(onRestore).not.toHaveBeenCalled();
      });
    });
  });
});
