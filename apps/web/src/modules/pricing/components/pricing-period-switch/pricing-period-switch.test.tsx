import { PRICE_PERIOD, SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';

import { PricingPeriodSwitch } from './pricing-period-switch';

const { tabs, periodSwitchLabel } = SITE_MESSAGES.pricingModule;

faker.seed(12);

const MOCK_MONTHLY_CONTENT = faker.lorem.words(3);
const MOCK_YEARLY_CONTENT = faker.lorem.words(4);

const setup = customRender(PricingPeriodSwitch, {
  panels: [
    { period: PRICE_PERIOD.MONTH, content: <p>{MOCK_MONTHLY_CONTENT}</p> },
    { period: PRICE_PERIOD.YEAR, content: <p>{MOCK_YEARLY_CONTENT}</p> },
  ],
});

describe(`<${PricingPeriodSwitch.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
  });

  it('shows only the monthly panel initially', () => {
    const monthlyContent = screen.getByText(MOCK_MONTHLY_CONTENT);
    const yearlyContent = screen.getByText(MOCK_YEARLY_CONTENT);

    expect(monthlyContent).toBeVisible();
    expect(yearlyContent).not.toBeVisible();
  });

  it('swaps to the yearly panel when Yearly is chosen', async () => {
    const yearlyRadio = screen.getByRole('radio', { name: tabs.YEAR });
    await user.click(yearlyRadio);

    const monthlyContent = screen.getByText(MOCK_MONTHLY_CONTENT);
    const yearlyContent = screen.getByText(MOCK_YEARLY_CONTENT);

    expect(yearlyContent).toBeVisible();
    expect(monthlyContent).not.toBeVisible();
  });

  it('swaps back to the monthly panel when Monthly is chosen again', async () => {
    const yearlyRadio = screen.getByRole('radio', { name: tabs.YEAR });
    const monthlyRadio = screen.getByRole('radio', { name: tabs.MONTH });
    await user.click(yearlyRadio);
    await user.click(monthlyRadio);

    const monthlyContent = screen.getByText(MOCK_MONTHLY_CONTENT);
    const yearlyContent = screen.getByText(MOCK_YEARLY_CONTENT);

    expect(monthlyContent).toBeVisible();
    expect(yearlyContent).not.toBeVisible();
  });

  it('labels the switch as the billing period', () => {
    const periodSwitch = screen.getByRole('radiogroup', {
      name: periodSwitchLabel,
    });

    expect(periodSwitch).toBeVisible();
  });
});
