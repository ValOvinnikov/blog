import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import messages from '@platform/i18n/messages/en.json';
import {
  updateLookAction,
  type TUpdateLookResult,
} from '@platform/server/site-config/update-look-action';
import { screen } from '@platform/testing/custom-render';
import {
  clickSave,
  nudgeAccentHue,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import {
  ALL_CHANGES_SAVED,
  UNSAVED_CHANGES,
  SAVING,
} from '@platform/testing/render-in-settings-form';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/components/features/look/look-preview');

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
    expect(saveButton).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');

    resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });
    await screen.findByText(ALL_CHANGES_SAVED);
  });

  it('keeps the change unsaved and shows the failure in the save bar on a failed save', async () => {
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
    expect(saveBar).toContainElement(alert);
  });
});
