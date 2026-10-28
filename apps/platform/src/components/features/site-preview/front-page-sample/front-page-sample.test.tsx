import { LOCALE_ISO_CODES } from '@blog/config';
import { SAMPLE_SUBMENU_TEST_ID } from '@platform/constants/sample-header';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_SAMPLE_HEADER_STYLE } from '@platform/testing/sample-header-style';
import { MOCK_SITE_PREVIEW_THEME } from '@platform/testing/site-preview-theme';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';

import { FrontPageSample } from './front-page-sample';

const {
  heroHeading: HERO_HEADING,
  heroText: HERO_TEXT,
  heroButton: HERO_BUTTON,
  firstPostTitle: FIRST_POST_TITLE,
  secondPostTitle: SECOND_POST_TITLE,
  thirdPostTitle: THIRD_POST_TITLE,
} = messages.frontPageSample;
const POST_TITLES = [FIRST_POST_TITLE, SECOND_POST_TITLE, THIRD_POST_TITLE];
const { readTimeChip: READ_TIME_CHIP, navTopics: NAV_TOPICS } =
  messages.lookPreview;

const setup = customRender(FrontPageSample, {
  tenantName: MOCK_TENANT_NAME,
  theme: MOCK_SITE_PREVIEW_THEME,
  liveLocales: [LOCALE_ISO_CODES.EN],
  header: MOCK_SAMPLE_HEADER_STYLE,
});

describe(`<${FrontPageSample.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('shows the site name in the header', () => {
    const header = screen.getByRole('banner');

    expect(header).toHaveTextContent(MOCK_TENANT_NAME);
  });

  it('opens with a hero and its call to action', () => {
    const heading = screen.getByRole('heading', {
      level: 3,
      name: HERO_HEADING,
    });
    const text = screen.getByText(HERO_TEXT);
    const button = screen.getByRole('button', { name: HERO_BUTTON });

    expect(heading).toBeVisible();
    expect(text).toBeVisible();
    expect(button).toBeVisible();
  });

  it('lists three posts with their reading time', () => {
    const titles = screen
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent);
    const readTimes = screen.getAllByText(READ_TIME_CHIP);

    expect(titles).toEqual(POST_TITLES);
    expect(readTimes).toHaveLength(POST_TITLES.length);
  });

  it('keeps the Topics sub-menu closed', () => {
    const topicsTrigger = screen.getByText(NAV_TOPICS);
    const submenu = screen.queryByTestId(SAMPLE_SUBMENU_TEST_ID);

    expect(topicsTrigger).toBeVisible();
    expect(submenu).not.toBeInTheDocument();
  });
});
