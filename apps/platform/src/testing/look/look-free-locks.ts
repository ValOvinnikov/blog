import type { TLookRow } from '@platform/constants/look-row';
import { ARIA_DISABLED, ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { GROWTH_BADGE_TEXT } from '@platform/testing/look/look-form-fixtures';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import type { UserEvent } from '@testing-library/user-event';

export interface ILockedStyleGroup {
  row: TLookRow;
  group: string;
  current: string;
  other: string;
}

export const expectStyleGroupLockedAtDefault = async (
  user: UserEvent,
  { row, group, current, other }: ILockedStyleGroup,
) => {
  await openLookRow(user, row);
  const styleGroup = screen.getByRole('group', {
    name: `${group} ${GROWTH_BADGE_TEXT}`,
  });
  const currentButton = within(styleGroup).getByRole('button', {
    name: current,
  });
  const otherButton = within(styleGroup).getByRole('button', { name: other });

  await user.click(otherButton);

  expect(currentButton).toHaveAttribute(ARIA_PRESSED, 'true');
  expect(otherButton).toHaveAttribute(ARIA_DISABLED, 'true');
  expect(otherButton).toHaveAttribute(ARIA_PRESSED, 'false');
};
