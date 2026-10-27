import { TOAST_TYPE } from '@blog/config';
import { Toast } from '@blog/ui/components/molecules/toast';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { ToastViewport } from './toast-viewport';

faker.seed(123);

const MOCK_ARIA_LABEL = faker.lorem.words(2);
const MOCK_FIRST_TITLE = faker.hacker.noun();
const MOCK_SECOND_TITLE = faker.hacker.noun();
const MOCK_FIRST_MESSAGE = faker.lorem.sentence();
const MOCK_SECOND_MESSAGE = faker.lorem.sentence();
const MOCK_DISMISS_LABEL = faker.lorem.word();

const setup = customRender(ToastViewport, { ariaLabel: MOCK_ARIA_LABEL });

describe(`<${ToastViewport.name}/>`, () => {
  it('renders a labelled region', () => {
    setup();

    const region = screen.getByRole('region', { name: MOCK_ARIA_LABEL });

    expect(region).toBeVisible();
  });

  it('renders Toast children in the order it is given', () => {
    setup({
      children: (
        <>
          <Toast
            type={TOAST_TYPE.SUCCESS}
            title={MOCK_FIRST_TITLE}
            message={MOCK_FIRST_MESSAGE}
            dismissLabel={MOCK_DISMISS_LABEL}
            onDismiss={vi.fn()}
            phase="visible"
          />
          <Toast
            type={TOAST_TYPE.INFO}
            title={MOCK_SECOND_TITLE}
            message={MOCK_SECOND_MESSAGE}
            dismissLabel={MOCK_DISMISS_LABEL}
            onDismiss={vi.fn()}
            phase="visible"
          />
        </>
      ),
    });

    const firstTitle = screen.getByText(MOCK_FIRST_TITLE);
    const secondTitle = screen.getByText(MOCK_SECOND_TITLE);

    expect(firstTitle.compareDocumentPosition(secondTitle)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
