import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { findServerEventHandlers } from '@platform/testing/server-event-handlers';
import userEvent from '@testing-library/user-event';

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

  describe('with a page handler instead of links', () => {
    const onPageChange = vi.fn();

    beforeEach(() => {
      onPageChange.mockReset();
    });

    it('asks for the neighbouring page', async () => {
      const user = userEvent.setup();
      setup({ pageHref: undefined, onPageChange });

      const nextButton = screen.getByRole('button', { name: NEXT });
      await user.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('keeps the boundary step focusable but inert', async () => {
      const user = userEvent.setup();
      setup({ page: 1, pageHref: undefined, onPageChange });

      const previous = screen.getByRole('button', { name: PREVIOUS });
      await user.click(previous);

      expect(previous).toHaveAttribute('aria-disabled', 'true');
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('is a named group, not a navigation landmark', () => {
      setup({ pageHref: undefined, onPageChange });

      const group = screen.getByRole('group', { name: PAGINATION });
      const navigation = screen.queryByRole('navigation');

      expect(group).toBeVisible();
      expect(navigation).not.toBeInTheDocument();
    });
  });

  it.each([1, 2])('renders from a Server Component on page %i of 2', (page) => {
    const handlers = findServerEventHandlers(
      <Pagination page={page} totalPages={2} pageHref={pageHref} />,
    );

    expect(handlers).toEqual([]);
  });
});
