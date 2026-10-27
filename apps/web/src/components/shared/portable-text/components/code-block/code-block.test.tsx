import { SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';

import { CodeBlock } from './code-block';

faker.seed(6007);

const MOCK_CODE = 'const x = 1;';
const MOCK_PLAIN_CODE = faker.lorem.sentence();
const MOCK_FILENAME = faker.system.commonFileName('ts');
const REGION_NAME = SITE_MESSAGES.codeBlock.regionLabel;

const setup = customRender(CodeBlock, {
  code: MOCK_CODE,
  language: 'typescript',
});

describe(`<${CodeBlock.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders the filename as a caption when provided', () => {
    setup({ filename: MOCK_FILENAME });

    const caption = screen.getByText(MOCK_FILENAME);

    expect(caption).toBeVisible();
  });

  it('renders without a language, falling back to plain text', () => {
    setup({ code: MOCK_PLAIN_CODE, language: undefined });

    const code = screen.getByText(MOCK_PLAIN_CODE);

    expect(code).toBeVisible();
  });

  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the code in a named region', () => {
      const region = screen.getByRole('region', { name: REGION_NAME });

      expect(region).toHaveTextContent(MOCK_CODE);
    });

    it('takes keyboard focus so an overflowing block can be scrolled', async () => {
      await user.tab();

      const region = screen.getByRole('region', { name: REGION_NAME });

      expect(region).toHaveFocus();
    });

    it('omits the filename caption when not provided', () => {
      const caption = screen.queryByTestId('filename-caption');

      expect(caption).not.toBeInTheDocument();
    });

    it('colors syntax tokens with theme-aware CSS variables, not literal colors', () => {
      const keyword = screen.getByText('const');

      expect(keyword.style.color).toMatch(/^var\(--/);
    });
  });
});
