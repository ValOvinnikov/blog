import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_RUN_PLUS_1_MIN_AT } from '@platform/testing/tenants/fixtures';

import { StepList, type TStepListStep } from './step-list';

faker.seed(5995);

const STEP_INDICATOR_GLYPH_TEST_ID = 'step-indicator-glyph';
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

    it('marks done and failed steps with a glyph and the rest with their number', () => {
      const glyphs = screen.getAllByTestId(STEP_INDICATOR_GLYPH_TEST_ID);
      const glyphTexts = glyphs.map((glyph) => glyph.textContent);

      expect(glyphTexts).toEqual(['✓', '2', '!', '4']);
    });

    it('hides every glyph from assistive tech', () => {
      const glyphs = screen.getAllByTestId(STEP_INDICATOR_GLYPH_TEST_ID);
      const hiddenGlyphs = glyphs.filter(
        (glyph) => glyph.getAttribute('aria-hidden') === 'true',
      );

      expect(hiddenGlyphs).toHaveLength(MOCK_STEPS.length);
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

  it('renders a formatted update time carrying the raw ISO value', () => {
    setup({
      steps: [
        mockStep({
          updatedAt: MOCK_RUN_PLUS_1_MIN_AT,
          updatedAtLabel: MOCK_UPDATED_AT_LABEL,
        }),
      ],
    });

    const timestamp = screen.getByRole('time');

    expect(timestamp).toHaveTextContent(MOCK_UPDATED_AT_LABEL);
    expect(timestamp).toHaveAttribute('dateTime', MOCK_RUN_PLUS_1_MIN_AT);
  });
});
