import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Spinner } from './spinner';

faker.seed(123);

const MOCK_LABEL = faker.lorem.words(2);
const ARIA_HIDDEN = 'aria-hidden';

const setup = customRender(Spinner, { label: MOCK_LABEL });

describe(`<${Spinner.name}/>`, () => {
  describe('without a visible label', () => {
    beforeEach(() => {
      setup();
    });

    it('is a status named by the label', () => {
      const status = screen.getByRole('status', { name: MOCK_LABEL });

      expect(status).toBeVisible();
    });

    it('does not render the label as visible text', () => {
      const labelText = screen.queryByText(MOCK_LABEL);

      expect(labelText).not.toBeInTheDocument();
    });

    it('hides the animated glyph from assistive tech', () => {
      const status = screen.getByRole('status', { name: MOCK_LABEL });
      // eslint-disable-next-line testing-library/no-node-access -- TODO: #6013
      const glyph = status.firstElementChild;

      expect(glyph).toHaveAttribute(ARIA_HIDDEN, 'true');
    });
  });

  describe('with a visible label', () => {
    beforeEach(() => {
      setup({ hasLabel: true });
    });

    it('renders the label as visible text', () => {
      const labelText = screen.getByText(MOCK_LABEL);

      expect(labelText).toBeVisible();
    });

    it('hides the visible label from assistive tech to avoid double announcing', () => {
      const labelText = screen.getByText(MOCK_LABEL);

      expect(labelText).toHaveAttribute(ARIA_HIDDEN, 'true');
    });
  });
});
