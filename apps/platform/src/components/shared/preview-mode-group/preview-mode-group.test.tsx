import { PREVIEW_MODE } from '@platform/constants/preview';
import en from '@platform/i18n/messages/en.json';
import { customRender, screen, within } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PreviewModeGroup } from './preview-mode-group';

const GROUP_NAME = en.previewModeControl.previewColorSchemeAriaLabel;
const LIGHT = 'Light';
const DARK = 'Dark';

const setup = customRender(PreviewModeGroup, {
  value: PREVIEW_MODE.LIGHT,
  onChange: vi.fn(),
});

describe(`<${PreviewModeGroup.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('presses only the button for the mode it is given', () => {
    setup({ value: PREVIEW_MODE.DARK });

    const group = screen.getByRole('group', { name: GROUP_NAME });
    const light = within(group).getByRole('button', { name: LIGHT });
    const dark = within(group).getByRole('button', { name: DARK });

    expect(dark).toBePressed();
    expect(light).not.toBePressed();
  });

  it('reports the mode of the button pressed', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const dark = screen.getByRole('button', { name: DARK });
    await user.click(dark);

    expect(onChange).toHaveBeenCalledWith(PREVIEW_MODE.DARK);
  });

  it('shows the tooltip at once on keyboard focus', async () => {
    setup();

    await user.tab();

    const tooltip = await screen.findByText(LIGHT, {
      selector: '[aria-hidden]',
    });

    expect(tooltip).toBeVisible();
  });
});
