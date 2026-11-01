import { faker } from '@faker-js/faker';
import { Switch } from '@platform/components/shared/switch';
import { ICON_TEST_ID } from '@platform/constants/icon';
import { ARIA_HIDDEN } from '@platform/testing/aria';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';

import { SettingRow } from './setting-row';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_LOCKED_REASON = faker.lorem.sentence();
const MOCK_CONTROL_LABEL = faker.lorem.word();
const MOCK_ARCHIVED_NOTICE_ID = faker.string.alpha(8);
const MOCK_ARCHIVED_NOTICE = faker.lorem.sentence();

const setup = customRender(SettingRow, {
  label: MOCK_LABEL,
  children: <button type="button">{MOCK_CONTROL_LABEL}</button>,
});

describe(`<${SettingRow.name}/>`, () => {
  it('shows the label and description', () => {
    setup({ description: MOCK_DESCRIPTION });

    const label = screen.getByText(MOCK_LABEL);
    const description = screen.getByText(MOCK_DESCRIPTION);

    expect(label).toBeVisible();
    expect(description).toBeVisible();
  });

  it('renders the control it is given', () => {
    setup();

    const control = screen.getByRole('button', { name: MOCK_CONTROL_LABEL });

    expect(control).toBeVisible();
  });

  it('shows the locked reason when locked', () => {
    setup({ isLocked: true, lockedReason: MOCK_LOCKED_REASON });

    const lockedReason = screen.getByText(MOCK_LOCKED_REASON);

    expect(lockedReason).toBeVisible();
  });

  it('shows a decorative lock icon beside the locked reason', () => {
    setup({ isLocked: true, lockedReason: MOCK_LOCKED_REASON });

    const lockIcon = screen.getByTestId(ICON_TEST_ID);

    expect(lockIcon).toHaveAttribute(ARIA_HIDDEN, 'true');
  });

  it('omits the locked reason when not locked, even if one is passed', () => {
    setup({ lockedReason: MOCK_LOCKED_REASON });

    const lockedReason = screen.queryByText(MOCK_LOCKED_REASON);

    expect(lockedReason).not.toBeInTheDocument();
  });

  it('omits the reason row when locked but no reason is given', () => {
    setup({ isLocked: true });

    const lockIcon = screen.queryByTestId(ICON_TEST_ID);

    expect(lockIcon).not.toBeInTheDocument();
  });

  it('adds its description and locked reason to the switch description', () => {
    renderWithIntl(
      <>
        <p id={MOCK_ARCHIVED_NOTICE_ID}>{MOCK_ARCHIVED_NOTICE}</p>
        <SettingRow
          label={MOCK_LABEL}
          description={MOCK_DESCRIPTION}
          isLocked={true}
          lockedReason={MOCK_LOCKED_REASON}
        >
          <Switch
            aria={{
              label: MOCK_CONTROL_LABEL,
              describedBy: MOCK_ARCHIVED_NOTICE_ID,
            }}
            isChecked={false}
            onCheckedChange={vi.fn()}
            labels={{ on: 'On', off: 'Off' }}
            isDisabled={true}
          />
        </SettingRow>
      </>,
    );

    const settingSwitch = screen.getByRole('switch', {
      name: MOCK_CONTROL_LABEL,
    });

    expect(settingSwitch).toHaveAccessibleDescription(
      `${MOCK_ARCHIVED_NOTICE} ${MOCK_DESCRIPTION} ${MOCK_LOCKED_REASON}`,
    );
  });
});
