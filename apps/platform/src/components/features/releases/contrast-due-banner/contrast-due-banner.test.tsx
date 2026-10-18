import { isContrastDue } from '@platform/server/releases/is-contrast-due';
import { customRenderAsync, screen } from '@platform/testing/custom-render';

import { ContrastDueBanner } from './contrast-due-banner';

vi.mock('@platform/server/releases/is-contrast-due', () => ({
  isContrastDue: vi.fn(),
}));

const isContrastDueMock = vi.mocked(isContrastDue);

const setup = customRenderAsync(ContrastDueBanner, {});

describe(ContrastDueBanner, () => {
  beforeEach(() => {
    isContrastDueMock.mockReset();
  });

  it('announces a due contrast check and links to Releases', async () => {
    isContrastDueMock.mockResolvedValue(true);

    await setup();

    expect(screen.getByRole('status')).toHaveTextContent('Contrast check due');
    expect(screen.getByRole('link', { name: 'Open Releases' })).toHaveAttribute(
      'href',
      '/releases',
    );
  });

  it('renders nothing when contrast is not due', async () => {
    isContrastDueMock.mockResolvedValue(false);

    await setup();

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Open Releases' }),
    ).not.toBeInTheDocument();
  });
});
