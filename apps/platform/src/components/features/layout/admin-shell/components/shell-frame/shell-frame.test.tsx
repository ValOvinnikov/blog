import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { useSelectedLayoutSegment } from 'next/navigation';

import { ShellFrame } from './shell-frame';

describe(ShellFrame, () => {
  afterEach(() => {
    vi.mocked(useSelectedLayoutSegment).mockReturnValue(null);
  });

  it('renders the sidebar, topbar and children together on an ordinary route', () => {
    renderWithIntl(
      <ShellFrame sidebar={<p>Sidebar</p>} topbar={<p>Topbar</p>}>
        <p>Page content</p>
      </ShellFrame>,
    );

    expect(screen.getByText('Sidebar')).toBeVisible();
    expect(screen.getByText('Topbar')).toBeVisible();
    expect(screen.getByText('Page content')).toBeVisible();
  });

  it('still renders sidebar, topbar and children on the studio route, in full-bleed mode', () => {
    vi.mocked(useSelectedLayoutSegment).mockReturnValue('studio');

    renderWithIntl(
      <ShellFrame sidebar={<p>Sidebar</p>} topbar={<p>Topbar</p>}>
        <p>Studio content</p>
      </ShellFrame>,
    );

    expect(screen.getByText('Sidebar')).toBeVisible();
    expect(screen.getByText('Topbar')).toBeVisible();
    expect(screen.getByText('Studio content')).toBeVisible();
  });

  it('renders a notice above the page content', () => {
    renderWithIntl(
      <ShellFrame
        sidebar={<p>Sidebar</p>}
        topbar={<p>Topbar</p>}
        notice={<p>Contrast check due</p>}
      >
        <p>Page content</p>
      </ShellFrame>,
    );

    expect(screen.getByText('Contrast check due')).toBeVisible();
    expect(screen.getByRole('main')).not.toContainElement(
      screen.getByText('Contrast check due'),
    );
  });

  it('seeds the sidebar-collapse boundary from isSidebarInitiallyCollapsed', () => {
    renderWithIntl(
      <ShellFrame
        sidebar={<aside>Sidebar</aside>}
        topbar={<p>Topbar</p>}
        isSidebarInitiallyCollapsed={true}
      >
        <p>Page content</p>
      </ShellFrame>,
    );

    const boundary = screen.getByText('Sidebar').parentElement;
    expect(boundary).toHaveAttribute('data-collapsed', 'true');
  });

  it('defaults the sidebar-collapse boundary to expanded when the prop is omitted', () => {
    renderWithIntl(
      <ShellFrame sidebar={<aside>Sidebar</aside>} topbar={<p>Topbar</p>}>
        <p>Page content</p>
      </ShellFrame>,
    );

    const boundary = screen.getByText('Sidebar').parentElement;
    expect(boundary).not.toHaveAttribute('data-collapsed');
  });
});
