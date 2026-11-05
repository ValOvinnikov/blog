import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setupLookForm();
  });

  it('focuses a select from its title and leaves its list closed', async () => {
    await openLookRow(user, LOOK_ROW.BUTTONS);

    const title = screen.getByText(LOOK_FORM.spinnerStyleLabel);
    await user.click(title);

    const select = screen.getByRole('combobox', {
      name: LOOK_FORM.spinnerStyleLabel,
    });
    const list = screen.queryByRole('listbox');

    expect(select).toHaveFocus();
    expect(list).not.toBeInTheDocument();
  });

  it('focuses the hue slider from its title', async () => {
    await openLookRow(user, LOOK_ROW.COLOUR);

    const title = screen.getByText(LOOK_FORM.accentHueLabel);
    await user.click(title);

    const slider = screen.getByRole('slider', {
      name: LOOK_FORM.accentHueLabel,
    });

    expect(slider).toHaveFocus();
  });
});
