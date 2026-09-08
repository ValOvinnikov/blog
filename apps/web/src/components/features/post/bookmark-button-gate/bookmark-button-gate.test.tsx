import { customRenderAsync, screen } from '@web/testing/custom-render';

import { BookmarkButtonGate } from './bookmark-button-gate';

const { isCapabilityEnabledMock } = vi.hoisted(() => ({
  isCapabilityEnabledMock: vi.fn(),
}));

vi.mock('@web/server/settings-features/is-capability-enabled', () => ({
  isCapabilityEnabled: isCapabilityEnabledMock,
}));

// `BookmarkButton` calls `useSession()`/`useToast()` unconditionally — a
// signed-out session (the default here) renders nothing, so a minimal stub
// mock is enough to prove `BookmarkButtonGate` mounts it at all.
vi.mock('@web/components/shared/bookmark-button', () => ({
  BookmarkButton: ({ postId }: { postId: string }) => (
    <div data-testid="bookmark-button">{postId}</div>
  ),
}));

const setup = customRenderAsync(BookmarkButtonGate, {
  postId: 'post-1',
  tenant: 'tenant-1',
});

describe(BookmarkButtonGate, () => {
  beforeEach(() => {
    isCapabilityEnabledMock.mockReset();
  });

  it('renders BookmarkButton with the given postId when the BOOKMARKS capability is enabled', async () => {
    isCapabilityEnabledMock.mockResolvedValue(true);

    await setup();

    expect(screen.getByTestId('bookmark-button')).toHaveTextContent('post-1');
  });

  it('renders nothing when the BOOKMARKS capability is not entitled/enabled', async () => {
    isCapabilityEnabledMock.mockResolvedValue(false);

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('forwards the tenant route param to isCapabilityEnabled', async () => {
    isCapabilityEnabledMock.mockResolvedValue(false);

    await setup();

    expect(isCapabilityEnabledMock).toHaveBeenCalledWith(
      'BOOKMARKS',
      'tenant-1',
    );
  });
});
