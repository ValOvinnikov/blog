import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { RunErrorCard } from './run-error-card';

const render = renderWithIntl;

const baseProps = {
  headline: 'This step failed',
  body: 'Something went wrong.',
  nextStep: 'Retry.',
  technicalDetailsLabel: 'Technical details',
};

describe(RunErrorCard, () => {
  it('announces the error with its headline as the card heading', () => {
    render(<RunErrorCard {...baseProps} headingLevel={3} />);

    expect(screen.getByRole('alert')).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 3, name: 'This step failed' }),
    ).toBeVisible();
    expect(screen.getByText('Something went wrong.')).toBeVisible();
    expect(screen.getByText('Retry.')).toBeVisible();
  });

  it('names the failed step when one is given', () => {
    render(
      <RunErrorCard
        {...baseProps}
        failedStepLine='Failed while running "Seed".'
      />,
    );

    expect(screen.getByText('Failed while running "Seed".')).toBeVisible();
  });

  it('offers the technical details only when there are some', () => {
    const { rerender } = render(<RunErrorCard {...baseProps} />);

    expect(screen.queryByText('Technical details')).not.toBeInTheDocument();

    rerender(<RunErrorCard {...baseProps} technicalDetails="500 boom" />);

    expect(screen.getByText('Technical details')).toBeVisible();
  });
});
