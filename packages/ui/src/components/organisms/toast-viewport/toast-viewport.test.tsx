import { faker } from '@faker-js/faker';
import { TOAST_TYPE } from '@shinefold/config';
import { Toast } from '@shinefold/ui/components/molecules/toast';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';

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
            toast={{
              type: TOAST_TYPE.SUCCESS,
              title: MOCK_FIRST_TITLE,
              message: MOCK_FIRST_MESSAGE,
              phase: 'visible',
            }}
            dismissLabel={MOCK_DISMISS_LABEL}
            onDismiss={vi.fn()}
          />
          <Toast
            toast={{
              type: TOAST_TYPE.INFO,
              title: MOCK_SECOND_TITLE,
              message: MOCK_SECOND_MESSAGE,
              phase: 'visible',
            }}
            dismissLabel={MOCK_DISMISS_LABEL}
            onDismiss={vi.fn()}
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
