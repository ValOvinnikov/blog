import { DEPTH } from '@blog/config';
import userEvent from '@testing-library/user-event';
import { DEPTH_STORAGE_KEY } from '@web/config/depth-script';
import { renderElement, screen, waitFor } from '@web/testing/custom-render';

import { DepthProvider, useDepth } from './depth-provider';

const ReadDepth = () => {
  const { depth, setDepth } = useDepth();
  return (
    <>
      <span data-testid="depth">{depth}</span>
      <button type="button" onClick={() => setDepth(DEPTH.DEEP)}>
        Go deep
      </button>
    </>
  );
};

describe(`<${DepthProvider.name}/>`, () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children', () => {
    renderElement(
      <DepthProvider hasSkim={false} hasDeep={false}>
        <p>Article body</p>
      </DepthProvider>,
    );

    expect(screen.getByText('Article body')).toBeVisible();
  });

  it('defaults to DEPTH.READ and stamps it as data-depth on the wrapper', async () => {
    const { container } = renderElement(
      <DepthProvider hasSkim={true} hasDeep={true}>
        <ReadDepth />
      </DepthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('depth')).toHaveTextContent(DEPTH.READ),
    );
    expect(container.querySelector('[data-depth]')).toHaveAttribute(
      'data-depth',
      DEPTH.READ,
    );
  });

  it('restores a stored DEEP depth on mount when the post has asides', async () => {
    localStorage.setItem(DEPTH_STORAGE_KEY, DEPTH.DEEP);

    const { container } = renderElement(
      <DepthProvider hasSkim={false} hasDeep={true}>
        <ReadDepth />
      </DepthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('depth')).toHaveTextContent(DEPTH.DEEP),
    );
    expect(container.querySelector('[data-depth]')).toHaveAttribute(
      'data-depth',
      DEPTH.DEEP,
    );
  });

  it('ignores a garbage stored value and falls back to READ', async () => {
    localStorage.setItem(DEPTH_STORAGE_KEY, 'NONSENSE');

    renderElement(
      <DepthProvider hasSkim={true} hasDeep={true}>
        <ReadDepth />
      </DepthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('depth')).toHaveTextContent(DEPTH.READ),
    );
  });

  it('clamps a stored SKIM depth to READ when this post has no skim (e.g. persisted from a different post) — a reader must never be stranded with the body hidden and no toggle option to escape', async () => {
    localStorage.setItem(DEPTH_STORAGE_KEY, DEPTH.SKIM);

    renderElement(
      <DepthProvider hasSkim={false} hasDeep={false}>
        <ReadDepth />
      </DepthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('depth')).toHaveTextContent(DEPTH.READ),
    );
  });

  it('clamps a stored DEEP depth to READ when this post has no asides', async () => {
    localStorage.setItem(DEPTH_STORAGE_KEY, DEPTH.DEEP);

    renderElement(
      <DepthProvider hasSkim={true} hasDeep={false}>
        <ReadDepth />
      </DepthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('depth')).toHaveTextContent(DEPTH.READ),
    );
  });

  it('re-clamps when hasSkim/hasDeep change without an unmount — the client-side-navigation-to-a-different-post case', async () => {
    localStorage.setItem(DEPTH_STORAGE_KEY, DEPTH.DEEP);

    const { rerender } = renderElement(
      <DepthProvider hasSkim={false} hasDeep={true}>
        <ReadDepth />
      </DepthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('depth')).toHaveTextContent(DEPTH.DEEP),
    );

    // Same component instance (no remount) — a client-side navigation to a
    // post with no asides would look exactly like this: new props, no new
    // `useEffect(() => …, [])` mount.
    rerender(
      <DepthProvider hasSkim={false} hasDeep={false}>
        <ReadDepth />
      </DepthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('depth')).toHaveTextContent(DEPTH.READ),
    );
  });

  it('setDepth persists the choice to localStorage and updates data-depth', async () => {
    const user = userEvent.setup();
    const { container } = renderElement(
      <DepthProvider hasSkim={false} hasDeep={true}>
        <ReadDepth />
      </DepthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Go deep' }));

    expect(localStorage.getItem(DEPTH_STORAGE_KEY)).toBe(DEPTH.DEEP);
    await waitFor(() =>
      expect(container.querySelector('[data-depth]')).toHaveAttribute(
        'data-depth',
        DEPTH.DEEP,
      ),
    );
  });
});
