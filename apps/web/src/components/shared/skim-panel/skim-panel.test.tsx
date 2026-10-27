import type { TPostTakeaways } from '@blog/service';
import { faker } from '@faker-js/faker';
import { DepthProvider } from '@web/context/depth-provider';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import type { ReactNode } from 'react';

import { SkimPanel } from './skim-panel';

faker.seed(5107);

const MOCK_TAKEAWAYS: TPostTakeaways = {
  takeaways: faker.helpers.uniqueArray(faker.lorem.sentence, 3),
  generatedAt: faker.date
    .past({ refDate: '2026-01-01T00:00:00.000Z' })
    .toISOString(),
  model: faker.lorem.word(),
};

const SkimDepthProvider = ({ children }: { children: ReactNode }) => (
  <DepthProvider hasSkim={true} hasDeep={false}>
    {children}
  </DepthProvider>
);

const setup = customRenderServerAsync(
  SkimPanel,
  { takeaways: MOCK_TAKEAWAYS },
  { wrapper: SkimDepthProvider },
);

describe(`<${SkimPanel.name}/>`, () => {
  it('lists every takeaway under the translated panel label', async () => {
    await setup();

    const panel = screen.getByRole('region', { name: '30-second summary' });
    const items = within(panel).getAllByRole('listitem');

    expect(items.map((item) => item.textContent)).toEqual(
      MOCK_TAKEAWAYS.takeaways,
    );
  });

  it('offers the button that switches to the full article', async () => {
    await setup();

    const readButton = screen.getByRole('button', {
      name: 'Read the full article',
    });

    expect(readButton).toBeVisible();
  });

  it('renders nothing when takeaways is undefined', async () => {
    await setup({ takeaways: undefined });

    const panel = screen.queryByRole('region');

    expect(panel).not.toBeInTheDocument();
  });
});
