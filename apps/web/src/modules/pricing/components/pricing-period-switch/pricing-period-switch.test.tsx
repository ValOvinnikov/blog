import { PRICE_PERIOD } from '@blog/config';
import userEvent from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';

import { PricingPeriodSwitch } from './pricing-period-switch';

const setup = customRender(PricingPeriodSwitch, {
  panels: [
    { period: PRICE_PERIOD.MONTH, content: <p>Monthly prices</p> },
    { period: PRICE_PERIOD.YEAR, content: <p>Yearly prices</p> },
  ],
});

describe(`<${PricingPeriodSwitch.name}/>`, () => {
  it('shows only the monthly panel initially', () => {
    setup();

    expect(screen.getByText('Monthly prices')).toBeVisible();
    expect(screen.getByText('Yearly prices')).not.toBeVisible();
  });

  it('swaps to the yearly panel when Yearly is chosen', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('radio', { name: 'Yearly' }));

    expect(screen.getByText('Yearly prices')).toBeVisible();
    expect(screen.getByText('Monthly prices')).not.toBeVisible();
  });

  it('swaps back to the monthly panel when Monthly is chosen again', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('radio', { name: 'Yearly' }));
    await user.click(screen.getByRole('radio', { name: 'Monthly' }));

    expect(screen.getByText('Monthly prices')).toBeVisible();
    expect(screen.getByText('Yearly prices')).not.toBeVisible();
  });

  it('labels the switch as the billing period', () => {
    setup();

    expect(
      screen.getByRole('radiogroup', { name: 'Billing period' }),
    ).toBeVisible();
  });
});
