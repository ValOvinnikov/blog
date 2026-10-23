import { LOCALE_ISO_CODES, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import { getRequestContext } from '@web/server/request-context/request-context';
import { screen, within } from '@web/testing/custom-render';
import type { TAsyncSetup } from '@web/testing/shared/async-setup/async-setup';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import type { Mock } from 'vitest';

interface IBreadcrumbTrailStep {
  label: string;
  href?: string;
}

interface IWithLoaderMock {
  pageLoaderMock: Mock;
  setup: TAsyncSetup;
}

interface IWithSuccessData<TData> extends IWithLoaderMock {
  successData: TData;
}

export const testNotFoundWithoutLog = ({
  pageLoaderMock,
  setup,
}: IWithLoaderMock) => {
  it('calls notFound() without logging when the page document is missing', async () => {
    pageLoaderMock.mockResolvedValue(okResult());

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
  });
};

export const testNotFoundOnFetchFailure = ({
  pageLoaderMock,
  setup,
  eventFragment,
}: IWithLoaderMock & { eventFragment?: string }) => {
  it('calls notFound() when the fetch fails', async () => {
    pageLoaderMock.mockResolvedValue(errorResult(new Error('boom')));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    if (eventFragment) {
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        eventFragment,
        expect.anything(),
      );
    }
  });
};

export const testBreadcrumbsTrail = <TData,>({
  pageLoaderMock,
  setup,
  successData,
  linkSteps,
  currentLabel,
}: IWithSuccessData<TData> & {
  linkSteps: Required<IBreadcrumbTrailStep>[];
  currentLabel: string;
}) => {
  it('renders the breadcrumbs trail', async () => {
    pageLoaderMock.mockResolvedValue(okResult(successData));

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    linkSteps.forEach((step) => {
      const link = within(nav).getByRole('link', { name: step.label });
      expect(link).toHaveAttribute('href', step.href);
    });

    const currentEl = within(nav).getByText(currentLabel);
    expect(currentEl).toHaveAttribute('aria-current', 'page');
    expect(currentEl.tagName).not.toBe('A');
  });
};

export const testBreadcrumbsJsonLdSchema = <TData,>({
  pageLoaderMock,
  setup,
  successData,
  itemPath,
}: Partial<IWithSuccessData<TData>> & {
  setup: TAsyncSetup;
  itemPath: string;
}) => {
  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    pageLoaderMock?.mockResolvedValue(okResult(successData));

    await setup();

    const script = screen.getByTestId(JSON_LD_SCRIPT_TEST_ID);
    expect(script).toHaveAttribute('type', 'application/ld+json');
    expect(script.textContent).toContain('"@type":"BreadcrumbList"');
    expect(script.textContent).toContain(
      `"item":"https://example.com${itemPath}"`,
    );
  });

  it('prefixes the JSON-LD item URLs with the language on a non-default-language page', async () => {
    pageLoaderMock?.mockResolvedValue(okResult(successData));
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
    });

    await setup();

    expect(screen.getByTestId(JSON_LD_SCRIPT_TEST_ID).textContent).toContain(
      `"item":"https://example.com/nl${itemPath}"`,
    );
  });
};

export const testNoJsonLdWithoutBaseUrl = <TData,>({
  pageLoaderMock,
  setup,
  successData,
}: Partial<IWithSuccessData<TData>> & {
  setup: TAsyncSetup;
}) => {
  it('renders no JSON-LD script when the base URL cannot be resolved', async () => {
    pageLoaderMock?.mockResolvedValue(okResult(successData));
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      metadataBase: undefined,
    });

    await setup();

    expect(
      screen.queryByTestId(JSON_LD_SCRIPT_TEST_ID),
    ).not.toBeInTheDocument();
  });
};

export const testForwardsArgsToLoader = <TData,>({
  pageLoaderMock,
  setup,
  successData,
  description,
  expectedArgs,
}: IWithSuccessData<TData> & {
  description: string;
  expectedArgs: unknown[];
}) => {
  it(description, async () => {
    pageLoaderMock.mockResolvedValue(okResult(successData));

    await setup();

    expect(pageLoaderMock).toHaveBeenCalledWith(...expectedArgs);
  });
};

export const testBreadcrumbsJsonLdTrail = <TData,>({
  pageLoaderMock,
  setup,
  successData,
  expectedTrail,
}: IWithSuccessData<TData> & {
  expectedTrail: { name: string; path: string }[];
}) => {
  it('emits a BreadcrumbList node for each crumb in the trail', async () => {
    pageLoaderMock.mockResolvedValue(okResult(successData));

    await setup();

    const schema = JSON.parse(
      screen.getByTestId(JSON_LD_SCRIPT_TEST_ID).textContent ?? '',
    );
    expect(schema.itemListElement).toEqual(
      expectedTrail.map(({ name, path }, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name,
        item: `https://example.com${path}`,
      })),
    );
  });
};
