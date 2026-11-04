import { ACTION_OUTCOME } from '@blog/config';
import messages from '@platform/i18n/messages/en.json';
import {
  updateLookAction,
  type TUpdateLookResult,
} from '@platform/server/site-config/update-look-action';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { screen, waitFor } from '@platform/testing/custom-render';
import {
  DEFAULT_ACCENT_HUE,
  DISCARD,
  hueValue,
  NUDGED_ACCENT_HUE,
  savedLookValues,
  SAVING,
} from '@platform/testing/look/look-form-fixtures';
import {
  clickSave,
  nudgeAccentHue,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import {
  ALL_CHANGES_SAVED,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const ALERT_TIMEOUT_MS = 15_000;

const setupAndSaveNudgedHue = async (user: UserEvent) => {
  setupLookForm();
  await nudgeAccentHue(user);
  await clickSave(user);
};

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(updateLookAction).mockReset();
  });

  describe('with the default values', () => {
    beforeEach(() => {
      setupLookForm();
    });

    describe('after nudging the accent hue', () => {
      beforeEach(async () => {
        await nudgeAccentHue(user);
      });

      it('marks only the card holding an unsaved change', () => {
        const colourHeading = screen.getByRole('heading', {
          name: `${LOOK_FORM.colourHeading}${UNSAVED_CHANGES}`,
        });
        const typeHeading = screen.getByRole('heading', {
          name: LOOK_FORM.typeHeading,
        });

        expect(colourHeading).toBeVisible();
        expect(typeHeading).toBeVisible();
      });

      it('discards unsaved changes back to the saved values', async () => {
        const discardButton = screen.getByRole('button', { name: DISCARD });
        await user.click(discardButton);

        const hueReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
        const saveButton = screen.queryByRole('button', {
          name: SAVE_CHANGES,
        });
        expect(hueReadout).toBeVisible();
        expect(saveButton).not.toBeInTheDocument();
      });

      describe('and saved', () => {
        beforeEach(async () => {
          await clickSave(user);
        });

        it('saves the nudged hue with the rest of the current look', async () => {
          await waitFor(() => {
            expect(updateLookAction).toHaveBeenCalledWith(
              MOCK_TENANT_ID,
              savedLookValues({ accentHue: NUDGED_ACCENT_HUE }),
            );
          });
        });

        it('shows a save-confirmation toast once the save resolves', async () => {
          const toast = await screen.findByText(LOOK_FORM.alertSuccess);

          expect(toast).toBeVisible();
        });

        it('hides the save bar once the save resolves', async () => {
          const savedNote = await screen.findByText(ALL_CHANGES_SAVED);
          const saveButton = screen.queryByRole('button', {
            name: SAVE_CHANGES,
          });

          expect(savedNote).toBeVisible();
          expect(saveButton).not.toBeInTheDocument();
        });
      });
    });
  });

  it('marks Save busy while the save is in flight', async () => {
    let resolveAction: (value: TUpdateLookResult) => void = () => {};
    vi.mocked(updateLookAction).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    await setupAndSaveNudgedHue(user);

    const saveButton = await screen.findByRole('button', { name: SAVING });
    expect(saveButton).toHaveAttribute('aria-busy', 'true');
    expect(saveButton).toHaveAttribute(ARIA_DISABLED, 'true');

    resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });
    await screen.findByText(ALL_CHANGES_SAVED);
  });

  it('shows the error alert above the form and keeps the save bar unsaved when the save fails', async () => {
    vi.mocked(updateLookAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    await setupAndSaveNudgedHue(user);

    const alert = await screen.findByRole(
      'alert',
      {},
      { timeout: ALERT_TIMEOUT_MS },
    );
    const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
    expect(alert).toHaveTextContent(LOOK_FORM.alertError);
    expect(saveBar).not.toContainElement(alert);
    expect(saveBar).toHaveTextContent(/unsaved change/);
  });
});
