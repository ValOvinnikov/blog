import { faker } from '@faker-js/faker';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { Select } from './select';

faker.seed(7401);

const MOCK_ARIA_LABEL = faker.lorem.words(2);
const buildOption = () => ({
  value: faker.string.uuid(),
  label: faker.lorem.words(2),
  glyphTestId: faker.string.alpha(8),
});

const MOCK_SELECTED = buildOption();
const MOCK_OPTIONS = [MOCK_SELECTED, buildOption()];

const renderGlyph = (testId: string) => <svg data-testid={testId} />;

const renderSelect = () =>
  renderWithIntl(
    <Select value={MOCK_SELECTED.value} onChange={vi.fn()}>
      <Select.Trigger
        aria={{ label: MOCK_ARIA_LABEL }}
        glyph={renderGlyph(MOCK_SELECTED.glyphTestId)}
      >
        {MOCK_SELECTED.label}
      </Select.Trigger>
      <Select.Popup>
        {MOCK_OPTIONS.map(({ value, label, glyphTestId }) => (
          <Select.Item
            key={value}
            value={value}
            glyph={renderGlyph(glyphTestId)}
          >
            <Select.ItemText>{label}</Select.ItemText>
          </Select.Item>
        ))}
      </Select.Popup>
    </Select>,
  );

describe(`<${Select.name}/>`, () => {
  it('shows the selected option glyph in the closed trigger', () => {
    renderSelect();

    const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
    const glyph = within(trigger).getByTestId(MOCK_SELECTED.glyphTestId);

    expect(glyph).toBeInTheDocument();
  });

  it.each(MOCK_OPTIONS)(
    'shows the glyph of the option named $label by its text alone',
    async ({ label, glyphTestId }) => {
      const user = userEvent.setup();
      renderSelect();

      const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
      await user.click(trigger);
      const option = await screen.findByRole('option', { name: label });
      const glyph = within(option).getByTestId(glyphTestId);

      expect(glyph).toBeInTheDocument();
    },
  );
});
