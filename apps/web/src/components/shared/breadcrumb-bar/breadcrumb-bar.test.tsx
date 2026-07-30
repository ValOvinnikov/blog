import { customRender, screen } from '@web/testing/custom-render';

import { BreadcrumbBar } from './breadcrumb-bar';

const setup = customRender(BreadcrumbBar, {
  children: <div data-testid="breadcrumbs-slot" />,
});

describe(`<${BreadcrumbBar.name}/>`, () => {
  it('renders its children', () => {
    setup();

    expect(screen.getByTestId('breadcrumbs-slot')).toBeInTheDocument();
  });
});
