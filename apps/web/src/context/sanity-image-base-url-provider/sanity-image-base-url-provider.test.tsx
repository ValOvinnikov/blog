import { render } from '@testing-library/react';
import { renderElement, screen } from '@web/testing/custom-render';

import {
  SanityImageBaseUrlProvider,
  useSanityImageBaseUrl,
} from './sanity-image-base-url-provider';

const BASE_URL = 'https://cdn.sanity.io/images/test-project/test-dataset/';

const ReadBaseUrl = () => {
  const baseUrl = useSanityImageBaseUrl();
  return <span data-testid="base-url">{baseUrl}</span>;
};

describe(`<${SanityImageBaseUrlProvider.name}/>`, () => {
  it('renders children', () => {
    renderElement(
      <SanityImageBaseUrlProvider baseUrl={BASE_URL}>
        <p>Article body</p>
      </SanityImageBaseUrlProvider>,
    );

    expect(screen.getByText('Article body')).toBeVisible();
  });

  it('exposes the provided base URL to a descendant reading useSanityImageBaseUrl', () => {
    renderElement(
      <SanityImageBaseUrlProvider baseUrl={BASE_URL}>
        <ReadBaseUrl />
      </SanityImageBaseUrlProvider>,
    );

    expect(screen.getByTestId('base-url')).toHaveTextContent(BASE_URL);
  });

  it('lets a nested provider override the base URL for its own subtree', () => {
    const OTHER_BASE_URL =
      'https://cdn.sanity.io/images/other-project/other-dataset/';

    renderElement(
      <SanityImageBaseUrlProvider baseUrl={BASE_URL}>
        <SanityImageBaseUrlProvider baseUrl={OTHER_BASE_URL}>
          <ReadBaseUrl />
        </SanityImageBaseUrlProvider>
      </SanityImageBaseUrlProvider>,
    );

    expect(screen.getByTestId('base-url')).toHaveTextContent(OTHER_BASE_URL);
  });

  it('throws when read outside a SanityImageBaseUrlProvider', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Unwrapped `render` (not `renderElement`) — the shared test `Providers`
    // wrapper mounts its own `SanityImageBaseUrlProvider` by default, which
    // would mask this outside-provider case.
    expect(() => render(<ReadBaseUrl />)).toThrow(
      'useSanityImageBaseUrl must be used within a SanityImageBaseUrlProvider',
    );

    consoleErrorSpy.mockRestore();
  });
});
