import { DEPTH } from '@blog/config';
import type { TPostSkim } from '@blog/service';
import userEvent from '@testing-library/user-event';
import { DEPTH_STORAGE_KEY } from '@web/config/depth-script';
import { DepthProvider } from '@web/context/depth-provider';
import { renderElement, screen, waitFor } from '@web/testing/custom-render';

import { SkimPanel, type ISkimPanelProps } from './skim-panel';

const skim: TPostSkim = {
  takeaways: ['First takeaway.', 'Second takeaway.', 'Third takeaway.'],
  generatedAt: '2026-01-01T00:00:00.000Z',
  model: 'claude-haiku-4-5',
};

// `SkimPanel` renders `SwitchToReadButton`, a client leaf that reads
// `useDepth()` — every render needs a `DepthProvider` ancestor, matching how
// `BlogPostPage` composes it in practice. `SkimPanel` is itself an async
// Server Component now (it reads its own translations), so this awaits its
// resolved element before wrapping it in the provider for a synchronous RTL
// render.
const setup = async (overrides?: Partial<ISkimPanelProps>) => {
  const element = await SkimPanel({ skim, ...overrides });
  return renderElement(
    <DepthProvider hasSkim={true} hasDeep={false}>
      {element}
    </DepthProvider>,
  );
};

describe(SkimPanel, () => {
  it('renders one <li> per takeaway', async () => {
    await setup();

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('First takeaway.')).toBeVisible();
    expect(screen.getByText('Second takeaway.')).toBeVisible();
    expect(screen.getByText('Third takeaway.')).toBeVisible();
  });

  it('renders nothing when skim is undefined', async () => {
    const { container } = await setup({ skim: undefined });

    expect(container.querySelector('section')).not.toBeInTheDocument();
  });

  it('renders the translated panel label and "read the full article" copy', async () => {
    await setup();

    expect(
      screen.getByRole('region', { name: '30-second summary' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Read the full article' }),
    ).toBeInTheDocument();
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
