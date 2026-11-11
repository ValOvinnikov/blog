import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  chooseSegment,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const NAV_LINKS_LABEL = LOOK_FORM.navLinkStyleLabel;
const USE_PRESET_NAV_LINKS = makeEnTranslator('lookForm')(
  'usePresetValueAriaLabel',
  { field: NAV_LINKS_LABEL },
);

describe(`<${LookForm.name}/> navigation links`, () => {
  let user: UserEvent;

  beforeEach(async () => {
    user = userEvent.setup();
    setupLookForm();
    await openLookRow(user, LOOK_ROW.HEADER);
  });

  it('previews the chosen style before saving', async () => {
    await chooseSegment(
      user,
      NAV_LINKS_LABEL,
      LOOK_FORM.navLinkStyleOptionLabel.UNDERLINE,
    );

    const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);
    expect(sampleTokens).toHaveStyle({ '--nav-link-decoration': 'underline' });
  });

  it('puts the style back to the preset value', async () => {
    await chooseSegment(
      user,
      NAV_LINKS_LABEL,
      LOOK_FORM.navLinkStyleOptionLabel.PILL,
    );
    const usePresetButton = screen.getByRole('button', {
      name: USE_PRESET_NAV_LINKS,
    });

    await user.click(usePresetButton);

    const group = screen.getByRole('group', { name: NAV_LINKS_LABEL });
    const plain = within(group).getByRole('button', {
      name: LOOK_FORM.navLinkStyleOptionLabel.PLAIN,
    });
    expect(plain).toHaveAttribute(ARIA_PRESSED, 'true');
  });
});
