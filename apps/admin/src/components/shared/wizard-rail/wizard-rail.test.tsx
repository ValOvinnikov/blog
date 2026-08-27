import { render, screen } from '@admin/testing/custom-render';

import { WizardRail } from './wizard-rail';

const steps = [
  { title: 'Details', description: 'Name, slug, plan' },
  { title: 'Sanity project', description: 'Create + configure' },
  { title: 'Seed content', description: 'Starter documents' },
];

describe(WizardRail, () => {
  it('renders every step title and description', () => {
    render(<WizardRail steps={steps} activeIndex={0} ariaLabel="Steps" />);

    expect(screen.getByText('Details')).toBeVisible();
    expect(screen.getByText('Name, slug, plan')).toBeVisible();
    expect(screen.getByText('Sanity project')).toBeVisible();
    expect(screen.getByText('Seed content')).toBeVisible();
  });

  it('marks the active step with aria-current="step" and no other step', () => {
    render(<WizardRail steps={steps} activeIndex={1} ariaLabel="Steps" />);

    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(items[2]).not.toHaveAttribute('aria-current');
  });

  it('exposes the list under the given accessible name', () => {
    render(
      <WizardRail
        steps={steps}
        activeIndex={0}
        ariaLabel="Provisioning steps"
      />,
    );

    expect(
      screen.getByRole('navigation', { name: 'Provisioning steps' }),
    ).toBeVisible();
  });
});
