import { DEPTH } from '@blog/config';
import type { TPostTakeaways } from '@blog/service';
import userEvent from '@testing-library/user-event';
import { DEPTH_STORAGE_KEY } from '@web/config/depth-script';
import { DepthProvider } from '@web/context/depth-provider';
import { renderElement, screen, waitFor } from '@web/testing/custom-render';

import { SkimPanel, type ISkimPanelProps } from './skim-panel';

const takeaways: TPostTakeaways = {
  takeaways: ['First takeaway.', 'Second takeaway.', 'Third takeaway.'],
  generatedAt: '2026-01-01T00:00:00.000Z',
  model: 'claude-haiku-4-5',
};

const setup = async (overrides?: Partial<ISkimPanelProps>) => {
  const element = await SkimPanel({ takeaways, ...overrides });
  return renderElement(
    <DepthProvider hasSkim={true} hasDeep={false}>
      {element}
    </DepthProvider>,
  );
};

describe(`<${SkimPanel.name}/>`, () => {
  describe('with takeaways', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders one <li> per takeaway', () => {
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
      expect(screen.getByText('First takeaway.')).toBeVisible();
      expect(screen.getByText('Second takeaway.')).toBeVisible();
      expect(screen.getByText('Third takeaway.')).toBeVisible();
    });

    it('renders the translated panel label and "read the full article" copy', () => {
      expect(
        screen.getByRole('region', { name: '30-second summary' }),
      ).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Read the full article' }),
      ).toBeVisible();
    });
  });

  it('renders nothing when takeaways is undefined', async () => {
    await setup({ takeaways: undefined });

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('the "read the full article" button switches depth back to READ', async () => {
    localStorage.clear();
    localStorage.setItem(DEPTH_STORAGE_KEY, DEPTH.SKIM);
    const user = userEvent.setup();

    await setup();

    await user.click(
      screen.getByRole('button', { name: 'Read the full article' }),
    );

    await waitFor(() =>
      expect(localStorage.getItem(DEPTH_STORAGE_KEY)).toBe(DEPTH.READ),
    );
  });
});
