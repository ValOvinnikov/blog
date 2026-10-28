import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { SAMPLE_SUBMENU_TEST_ID } from '@platform/constants/sample-header';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_SITE_PREVIEW_THEME } from '@platform/testing/site-preview-theme';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';

import { FrontPageSample } from './front-page-sample';

const POST_TITLES = [
  'A morning on the pier',
  'Low tide, late light',
  'The harbour in winter',
];

const setup = customRender(FrontPageSample, {
  tenantName: MOCK_TENANT_NAME,
  theme: MOCK_SITE_PREVIEW_THEME,
  liveLocales: [LOCALE_ISO_CODES.EN],
  header: {
    layout: HEADER_LAYOUT.CLASSIC,
    submenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
    barStyle: HEADER_BAR_STYLE.FULL_WIDTH,
    languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
  },
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
      name: 'Dispatches from the coast',
    });
    const text = screen.getByText('Notes, essays and photographs.');
    const button = screen.getByRole('button', { name: 'Read the latest' });

    expect(heading).toBeVisible();
    expect(text).toBeVisible();
    expect(button).toBeVisible();
  });

  it('lists three posts with their reading time', () => {
    const titles = screen
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent);
    const readTimes = screen.getAllByText('4 min read');

    expect(titles).toEqual(POST_TITLES);
    expect(readTimes).toHaveLength(POST_TITLES.length);
  });

  it('keeps the Topics sub-menu closed', () => {
    const topicsTrigger = screen.getByText('Topics');
    const submenu = screen.queryByTestId(SAMPLE_SUBMENU_TEST_ID);

    expect(topicsTrigger).toBeVisible();
    expect(submenu).not.toBeInTheDocument();
  });
});
