import { SITE_MESSAGES } from '@blog/config';
import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CONFIGURATION_HEADING,
  MOCK_GETTING_STARTED_HEADING,
  MOCK_CONTENTS_HEADINGS,
} from '@web/testing/shared/contents-rail/fixtures';
import {
  FakeIntersectionObserver,
  stubFakeIntersectionObserver,
} from '@web/testing/shared/intersection-observer/fake-intersection-observer';

import { ContentsRail } from './contents-rail';

vi.mock('@web/i18n/navigation');

const NAV_NAME = SITE_MESSAGES.contentsRail.label;

const ArticleWithContentsRail = () => (
  <>
    <ContentsRail headings={MOCK_CONTENTS_HEADINGS} />
    {MOCK_CONTENTS_HEADINGS.map(({ key, text }) => (
      <h2 key={key} id={key}>
        {text}
      </h2>
    ))}
  </>
);

const setup = customRender(ArticleWithContentsRail, {});

describe(`<${ContentsRail.name}/>`, () => {
  beforeEach(() => {
    stubFakeIntersectionObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('before any heading is active', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the nav landmark with the contents label', () => {
      const nav = screen.getByRole('navigation', { name: NAV_NAME });

      expect(nav).toBeVisible();
    });

    it('renders every heading as a link to its anchor', () => {
      MOCK_CONTENTS_HEADINGS.forEach((heading) => {
        const link = screen.getByRole('link', { name: heading.text });

        expect(link).toHaveAttribute('href', `#${heading.key}`);
      });
    });

    it('shows the mobile selector defaulting to the first heading', () => {
      const selector = screen.getByRole('button', {
        name: `${NAV_NAME} ${MOCK_GETTING_STARTED_HEADING.text}`,
      });

      expect(selector).toBeVisible();
    });

    it('marks the first heading as the current location', () => {
      const firstLink = screen.getByRole('link', {
        name: MOCK_GETTING_STARTED_HEADING.text,
      });

      expect(firstLink).toHaveAttribute(ARIA_CURRENT, 'location');
      MOCK_CONTENTS_HEADINGS.slice(1).forEach((heading) => {
        const link = screen.getByRole('link', { name: heading.text });

        expect(link).not.toHaveAttribute(ARIA_CURRENT);
      });
    });
  });

  describe('once a heading scrolls into view', () => {
    beforeEach(() => {
      setup();
      const configurationHeading = screen.getByRole('heading', {
        name: MOCK_CONFIGURATION_HEADING.text,
      });
      const headingObserver = FakeIntersectionObserver.instances.find(
        (observer) => observer.observed.includes(configurationHeading),
      );
      headingObserver?.trigger([
        {
          target: configurationHeading,
          isIntersecting: true,
          boundingClientRect: { top: 0 } as DOMRectReadOnly,
        },
      ]);
    });

    it('marks that heading as the current location, and no other', () => {
      const activeLink = screen.getByRole('link', {
        name: MOCK_CONFIGURATION_HEADING.text,
      });
      const firstLink = screen.getByRole('link', {
        name: MOCK_GETTING_STARTED_HEADING.text,
      });

      expect(activeLink).toHaveAttribute(ARIA_CURRENT, 'location');
      expect(firstLink).not.toHaveAttribute(ARIA_CURRENT);
    });

    it('shows that heading in the mobile selector', () => {
      const selector = screen.getByRole('button', {
        name: `${NAV_NAME} ${MOCK_CONFIGURATION_HEADING.text}`,
      });

      expect(selector).toBeVisible();
    });
  });
});
