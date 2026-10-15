import type { Page } from '@playwright/test';

type TStorybookWindow = Window & {
  __STORYBOOK_ADDONS_CHANNEL__: {
    on: (event: string, listener: () => void) => void;
    emit: (event: string, payload: unknown) => void;
  };
  __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
  contrastRenderCount: number;
};

const RENDER_TIMEOUT_MS = 30_000;

const FREEZE_MOTION_CSS = `*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
}`;

const settle = (page: Page) =>
  page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((image) => {
      (image as HTMLImageElement).loading = 'eager';
    });
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((image) =>
        image.decode().catch(() => undefined),
      ),
    );
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  });

export const openStory = async (page: Page, storyId: string) => {
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
  await page.waitForFunction(
    () =>
      ['completed', 'finished', 'errored'].includes(
        (window as unknown as TStorybookWindow).__STORYBOOK_PREVIEW__
          ?.currentRender?.phase ?? '',
      ),
    undefined,
    { timeout: RENDER_TIMEOUT_MS },
  );
  if (
    await page.evaluate(() =>
      document.body.classList.contains('sb-show-errordisplay'),
    )
  ) {
    throw new Error(`Story ${storyId} failed to render`);
  }
  await page.evaluate(() => {
    const storybook = window as unknown as TStorybookWindow;
    storybook.contrastRenderCount = 0;
    storybook.__STORYBOOK_ADDONS_CHANNEL__.on('storyRendered', () => {
      storybook.contrastRenderCount += 1;
    });
  });
  await page.addStyleTag({ content: FREEZE_MOTION_CSS });
};

// Storybook drops URL args a story's `argTypes` options don't list, which
// would silently skip BRAND_PRIMARY wherever a story narrows `brandVariant`.
export const updateStory = async (
  page: Page,
  event: 'updateStoryArgs' | 'updateGlobals',
  payload: Record<string, unknown>,
) => {
  const renderCount = await page.evaluate(
    ([eventName, eventPayload]) => {
      const storybook = window as unknown as TStorybookWindow;
      storybook.__STORYBOOK_ADDONS_CHANNEL__.emit(eventName, eventPayload);
      return storybook.contrastRenderCount;
    },
    [event, payload] as const,
  );
  await page.waitForFunction(
    (previousCount) =>
      (window as unknown as TStorybookWindow).contrastRenderCount >
      previousCount,
    renderCount,
    { timeout: RENDER_TIMEOUT_MS },
  );
  await settle(page);
};
