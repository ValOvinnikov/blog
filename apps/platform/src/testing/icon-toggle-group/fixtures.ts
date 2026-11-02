import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import type { TIconToggleGroupProps } from '@platform/components/shared/icon-toggle-group';

type TMockIconToggleOption = TIconToggleGroupProps<string>['options'][number];

export const mockIconToggleOption = (
  overrides: Partial<TMockIconToggleOption> = {},
): TMockIconToggleOption => ({
  value: faker.string.uuid(),
  icon: ICONS.PHONE,
  ariaLabel: faker.lorem.words(2),
  tooltip: faker.lorem.words(3),
  ...overrides,
});
