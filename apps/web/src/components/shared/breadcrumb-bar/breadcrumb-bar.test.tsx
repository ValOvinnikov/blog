import { customRender, screen } from '@web/testing/custom-render';

import { BreadcrumbBar } from './breadcrumb-bar';

const BREADCRUMBS_SLOT_TEST_ID = 'breadcrumbs-slot';

const setup = customRender(BreadcrumbBar, {
  children: <div data-testid={BREADCRUMBS_SLOT_TEST_ID} />,
});

describe(`<${BreadcrumbBar.name}/>`, () => {
  it('renders its children', () => {
    setup();

    const breadcrumbsSlot = screen.getByTestId(BREADCRUMBS_SLOT_TEST_ID);

    expect(breadcrumbsSlot).toBeVisible();
  });
});
