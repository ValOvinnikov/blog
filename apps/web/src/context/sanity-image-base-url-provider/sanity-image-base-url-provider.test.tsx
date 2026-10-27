import { faker } from '@faker-js/faker';
import { render, renderElement, screen } from '@web/testing/custom-render';

import {
  SanityImageBaseUrlProvider,
  useSanityImageBaseUrl,
} from './sanity-image-base-url-provider';

faker.seed(6012);

const MOCK_BASE_URL = faker.internet.url();
const MOCK_OTHER_BASE_URL = faker.internet.url();
const MOCK_BODY_TEXT = faker.lorem.sentence();

const ReadBaseUrl = () => {
  const baseUrl = useSanityImageBaseUrl();
  return <span data-testid="base-url">{baseUrl}</span>;
};

describe(`<${SanityImageBaseUrlProvider.name}/>`, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children', () => {
    renderElement(
      <SanityImageBaseUrlProvider baseUrl={MOCK_BASE_URL}>
        <p>{MOCK_BODY_TEXT}</p>
      </SanityImageBaseUrlProvider>,
    );

    const body = screen.getByText(MOCK_BODY_TEXT);

    expect(body).toBeVisible();
  });

  it('exposes the provided base URL to descendants', () => {
    renderElement(
      <SanityImageBaseUrlProvider baseUrl={MOCK_BASE_URL}>
        <ReadBaseUrl />
      </SanityImageBaseUrlProvider>,
    );

    const baseUrl = screen.getByTestId('base-url');

    expect(baseUrl).toHaveTextContent(MOCK_BASE_URL);
  });

  it('lets a nested provider override the base URL for its own subtree', () => {
    renderElement(
      <SanityImageBaseUrlProvider baseUrl={MOCK_BASE_URL}>
        <SanityImageBaseUrlProvider baseUrl={MOCK_OTHER_BASE_URL}>
          <ReadBaseUrl />
        </SanityImageBaseUrlProvider>
      </SanityImageBaseUrlProvider>,
    );

    const baseUrl = screen.getByTestId('base-url');

    expect(baseUrl).toHaveTextContent(MOCK_OTHER_BASE_URL);
  });

  it('throws when read outside its provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ReadBaseUrl />)).toThrow(
      'useSanityImageBaseUrl must be used within a SanityImageBaseUrlProvider',
    );
  });
});
