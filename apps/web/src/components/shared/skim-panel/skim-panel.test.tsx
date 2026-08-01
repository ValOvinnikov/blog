import { DEPTH } from '@blog/config';
import type { TPostSkim } from '@blog/service';
import userEvent from '@testing-library/user-event';
import { DepthProvider } from '@web/components/shared/depth-provider';
import { DEPTH_STORAGE_KEY } from '@web/config/depth-script';
import { renderElement, screen, waitFor } from '@web/testing/custom-render';

import { SkimPanel, type ISkimPanelProps } from './skim-panel';

const skim: TPostSkim = {
  takeaways: ['First takeaway.', 'Second takeaway.', 'Third takeaway.'],
  generatedAt: '2026-01-01T00:00:00.000Z',
  model: 'claude-haiku-4-5',
};

// `SkimPanel` renders `SwitchToReadButton`, a client leaf that reads
// `useDepth()` — every render needs a `DepthProvider` ancestor, matching how
// `BlogPostPage` composes it in practice.
const setup = (overrides?: Partial<ISkimPanelProps>) =>
  renderElement(
    <DepthProvider hasSkim={true} hasDeep={false}>
      <SkimPanel
        skim={skim}
        label="30-second summary"
        readFullArticleLabel="Read the full article"
        {...overrides}
      />
    </DepthProvider>,
  );

describe(`<${SkimPanel.name}/>`, () => {
  it('renders one <li> per takeaway', () => {
    setup();

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('First takeaway.')).toBeVisible();
    expect(screen.getByText('Second takeaway.')).toBeVisible();
    expect(screen.getByText('Third takeaway.')).toBeVisible();
  });

  it('renders nothing when skim is undefined', () => {
    const { container } = setup({ skim: undefined });

    expect(container.querySelector('section')).not.toBeInTheDocument();
  });

  it('the "read the full article" button switches depth back to READ', async () => {
    localStorage.clear();
    localStorage.setItem(DEPTH_STORAGE_KEY, DEPTH.SKIM);
    const user = userEvent.setup();

    setup();

    await user.click(
      screen.getByRole('button', { name: 'Read the full article' }),
    );

    await waitFor(() =>
      expect(localStorage.getItem(DEPTH_STORAGE_KEY)).toBe(DEPTH.READ),
    );
  });
});
