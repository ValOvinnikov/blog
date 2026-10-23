import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';

import { MakeItYoursCard } from './make-it-yours-card';

const render = renderWithIntl;

describe(MakeItYoursCard, () => {
  beforeEach(() => {
    render(<MakeItYoursCard />);
  });

  it('links to Look, Voice and Features', () => {
    const lookLink = screen.getByRole('link', { name: /Look/ });
    const voiceLink = screen.getByRole('link', { name: /Voice/ });
    const featuresLink = screen.getByRole('link', { name: /Features/ });

    expect(lookLink).toHaveAttribute('href', adminRoutes.dashboardLook());
    expect(voiceLink).toHaveAttribute('href', adminRoutes.dashboardVoice());
    expect(featuresLink).toHaveAttribute(
      'href',
      adminRoutes.dashboardFeatures(),
    );
  });

  it("nests the card's title one level under the page's own h1", () => {
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Make it yours',
    });

    expect(heading).toBeVisible();
  });
});
