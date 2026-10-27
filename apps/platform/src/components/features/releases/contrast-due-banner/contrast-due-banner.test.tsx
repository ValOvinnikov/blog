import { isContrastDue } from '@platform/server/releases/is-contrast-due';
import { customRenderAsync, screen } from '@platform/testing/custom-render';

import { ContrastDueBanner } from './contrast-due-banner';

vi.mock('@platform/server/releases/is-contrast-due', () => ({
  isContrastDue: vi.fn(),
}));

const isContrastDueMock = vi.mocked(isContrastDue);

const OPEN_RELEASES = { name: 'Open Releases' };

const setup = customRenderAsync(ContrastDueBanner, {});

describe(`<${ContrastDueBanner.name}/>`, () => {
  beforeEach(() => {
    isContrastDueMock.mockReset();
  });

  it('announces a due contrast check and links to Releases', async () => {
    isContrastDueMock.mockResolvedValue(true);

    await setup();

    const banner = screen.getByRole('status');
    const releasesLink = screen.getByRole('link', OPEN_RELEASES);

    expect(banner).toHaveTextContent('Contrast check due');
    expect(releasesLink).toHaveAttribute('href', '/releases');
  });

  it('renders nothing when contrast is not due', async () => {
    isContrastDueMock.mockResolvedValue(false);

    await setup();

    const banner = screen.queryByRole('status');
    const releasesLink = screen.queryByRole('link', OPEN_RELEASES);

    expect(banner).not.toBeInTheDocument();
    expect(releasesLink).not.toBeInTheDocument();
  });
});
