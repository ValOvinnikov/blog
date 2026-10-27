import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { findServerEventHandlers } from '@platform/testing/server-event-handlers';

import { Pagination } from './pagination';

vi.mock('@platform/i18n/navigation');

const {
  ariaLabel: PAGINATION,
  previous: PREVIOUS,
  next: NEXT,
} = messages.pagination;
const t = makeEnTranslator('pagination');

const pageHref = (page: number) => `/items?page=${page}`;

const setup = customRender(Pagination, {
  page: 2,
  totalPages: 3,
  pageHref,
});

describe(`<${Pagination.name}/>`, () => {
  it('renders nothing when everything fits on one page', () => {
    setup({ page: 1, totalPages: 1 });

    const navigation = screen.queryByRole('navigation', { name: PAGINATION });

    expect(navigation).not.toBeInTheDocument();
  });

  describe('on a middle page', () => {
    beforeEach(() => {
      setup();
    });

    it.each([
      [PREVIOUS, pageHref(1)],
      [NEXT, pageHref(3)],
    ])('links %s to its neighbouring page', (name, href) => {
      const link = screen.getByRole('link', { name });

      expect(link).toHaveAttribute('href', href);
    });

    it('states the current position', () => {
      const position = screen.getByText(
        t('status', { page: 2, totalPages: 3 }),
      );

      expect(position).toBeVisible();
    });
  });

  it.each([
    [PREVIOUS, 1],
    [NEXT, 3],
  ])('disables %s on page %i', (name, page) => {
    setup({ page });

    const button = screen.getByRole('button', { name });

    expect(button).toBeDisabled();
  });

  it.each([1, 2])('renders from a Server Component on page %i of 2', (page) => {
    const handlers = findServerEventHandlers(
      <Pagination page={page} totalPages={2} pageHref={pageHref} />,
    );

    expect(handlers).toEqual([]);
  });
});
