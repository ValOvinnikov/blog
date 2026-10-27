import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_RUN_PLUS_1_MIN_AT } from '@platform/testing/tenants/fixtures';

import { StepList, type TStepListStep } from './step-list';

faker.seed(5995);

const HIDDEN_ICON_SELECTOR = 'span[aria-hidden="true"]';
const STEP_CONNECTOR_TEST_ID = 'step-connector';
const MOCK_TRAILING_SLOT = faker.lorem.words(2);
const MOCK_UPDATED_AT_LABEL = faker.lorem.word();

const mockStep = (overrides: Partial<TStepListStep> = {}): TStepListStep => ({
  key: faker.string.uuid(),
  title: faker.lorem.words(2),
  status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  statusLabel: faker.lorem.word(),
  ...overrides,
});

const MOCK_STEPS = [
  mockStep({ status: TENANT_PROVISIONING_STEP_STATUS.DONE }),
  mockStep({ status: TENANT_PROVISIONING_STEP_STATUS.RUNNING }),
  mockStep({ status: TENANT_PROVISIONING_STEP_STATUS.FAILED }),
  mockStep({ status: TENANT_PROVISIONING_STEP_STATUS.IDLE }),
];

const setup = customRender(StepList, { steps: MOCK_STEPS });

describe(`<${StepList.name}/>`, () => {
  describe('with the full step set', () => {
    beforeEach(() => {
      setup();
    });

    it.each([
      [TENANT_PROVISIONING_STEP_STATUS.DONE, '✓'],
      [TENANT_PROVISIONING_STEP_STATUS.RUNNING, '2'],
      [TENANT_PROVISIONING_STEP_STATUS.FAILED, '!'],
      [TENANT_PROVISIONING_STEP_STATUS.IDLE, '4'],
    ])('shows the %s step with the decorative %s glyph', (_status, glyph) => {
      const indicatorGlyph = screen.getByText(glyph, {
        selector: HIDDEN_ICON_SELECTOR,
      });

      expect(indicatorGlyph).toBeVisible();
    });

    it('renders a connector after every step except the last', () => {
      const connectors = screen.getAllByTestId(STEP_CONNECTOR_TEST_ID);

      expect(connectors).toHaveLength(MOCK_STEPS.length - 1);
    });

    it('announces each step status in a live region', () => {
      const liveRegions = screen.getAllByRole('status');
      const announcements = liveRegions.map((region) => region.textContent);

      expect(announcements).toEqual(
        MOCK_STEPS.map(({ statusLabel }) => statusLabel),
      );
    });
  });

  it('renders an optional trailing slot next to a step', () => {
    setup({ steps: [mockStep({ trailingSlot: MOCK_TRAILING_SLOT })] });

    const trailingSlot = screen.getByText(MOCK_TRAILING_SLOT);

    expect(trailingSlot).toBeVisible();
  });

  it('renders a formatted update time as a <time> carrying the raw ISO value', () => {
    setup({
      steps: [
        mockStep({
          updatedAt: MOCK_RUN_PLUS_1_MIN_AT,
          updatedAtLabel: MOCK_UPDATED_AT_LABEL,
        }),
      ],
    });

    const timestamp = screen.getByText(MOCK_UPDATED_AT_LABEL);

    expect(timestamp.tagName).toBe('TIME');
    expect(timestamp).toHaveAttribute('dateTime', MOCK_RUN_PLUS_1_MIN_AT);
  });
});
