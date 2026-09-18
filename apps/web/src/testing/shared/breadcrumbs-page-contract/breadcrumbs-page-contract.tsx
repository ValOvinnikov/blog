import { screen, within } from '@web/testing/custom-render';
import type { TAsyncSetup } from '@web/testing/shared/async-setup/async-setup';
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
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    pageLoaderMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
};

export const testNotFoundOnFetchFailure = ({
  pageLoaderMock,
  setup,
  eventFragment,
}: IWithLoaderMock & { eventFragment?: string }) => {
  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    pageLoaderMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    if (eventFragment) {
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(eventFragment),
      );
    }
    errorSpy.mockRestore();
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
    pageLoaderMock.mockResolvedValue({ ok: true, data: successData });

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
    pageLoaderMock?.mockResolvedValue({ ok: true, data: successData });

    const { container } = await setup();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@type":"BreadcrumbList"');
    expect(script?.textContent).toContain(
      `"item":"https://example.com${itemPath}"`,
    );
  });
};

export const testNoJsonLdWithoutBaseUrl = <TData,>({
  pageLoaderMock,
  setup,
  successData,
  getTenantBaseUrlMock,
}: Partial<IWithSuccessData<TData>> & {
  setup: TAsyncSetup;
  getTenantBaseUrlMock: Mock;
}) => {
  it('renders no JSON-LD script when the base URL cannot be resolved', async () => {
    pageLoaderMock?.mockResolvedValue({ ok: true, data: successData });
    getTenantBaseUrlMock.mockResolvedValue(undefined);

    const { container } = await setup();

    expect(
      container.querySelector('script[type="application/ld+json"]'),
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
    pageLoaderMock.mockResolvedValue({ ok: true, data: successData });

    await setup();

    expect(pageLoaderMock).toHaveBeenCalledWith(...expectedArgs);
  });
};
