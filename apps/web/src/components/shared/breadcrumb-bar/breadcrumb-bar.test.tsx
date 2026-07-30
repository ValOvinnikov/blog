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

  it('renders a full-width outer band with the border', () => {
    const { container } = setup();

    const root = container.firstElementChild;
    expect(root?.className).toContain('w-full');
    expect(root?.className).toContain('border-b');
    expect(root?.className).not.toContain('max-w-page');
  });

  it('keeps children inside an inner max-w-page wrapper', () => {
    setup();

    const slot = screen.getByTestId('breadcrumbs-slot');
    const inner = slot.parentElement;
    expect(inner?.className).toContain('max-w-page');
    expect(inner).toContainElement(slot);
  });
});
