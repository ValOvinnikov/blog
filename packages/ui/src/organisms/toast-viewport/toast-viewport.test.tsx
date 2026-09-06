import { TOAST_TYPE } from '@blog/config';
import { Toast } from '@blog/ui/molecules/toast';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { ToastViewport } from './toast-viewport';

faker.seed(123);

const ariaLabel = faker.lorem.words(2);

const setup = customRender(ToastViewport, { ariaLabel });

describe(`<${ToastViewport.name}/>`, () => {
  it('renders a labelled region', () => {
    setup();
    expect(screen.getByRole('region', { name: ariaLabel })).toBeVisible();
  });

  it('renders Toast children in the order it is given', () => {
    const first = faker.hacker.noun();
    const second = faker.hacker.noun();
    setup({
      children: (
        <>
          <Toast
            type={TOAST_TYPE.SUCCESS}
            title={first}
            message="stashed"
            dismissLabel="Dismiss"
            onDismiss={vi.fn()}
            phase="visible"
          />
          <Toast
            type={TOAST_TYPE.INFO}
            title={second}
            message="removed"
            dismissLabel="Dismiss"
            onDismiss={vi.fn()}
            phase="visible"
          />
        </>
      ),
    });

    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(2);
    expect(statuses[0]).toHaveTextContent(first);
    expect(statuses[1]).toHaveTextContent(second);
  });

  it('forwards data-testid to the root element', () => {
    setup({ dataTestId: 'toast-viewport' });
    expect(screen.getByTestId('toast-viewport')).toBeVisible();
  });
});
