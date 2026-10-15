import type { Page } from '@playwright/test';

type TChannel = {
  on: (event: string, listener: () => void) => void;
  off: (event: string, listener: () => void) => void;
  emit: (event: string, payload: unknown) => void;
};

type TStorybookWindow = Window & { __STORYBOOK_ADDONS_CHANNEL__: TChannel };

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
  await page.waitForFunction(() =>
    ['sb-show-main', 'sb-show-errordisplay'].some((name) =>
      document.body.classList.contains(name),
    ),
  );
  if (
    await page.evaluate(() =>
      document.body.classList.contains('sb-show-errordisplay'),
    )
  ) {
    throw new Error(`Story ${storyId} failed to render`);
  }
  await page.addStyleTag({ content: FREEZE_MOTION_CSS });
};

// Storybook drops URL args a story's `argTypes` options don't list, which
// would silently skip BRAND_PRIMARY wherever a story narrows `brandVariant`.
export const updateStory = async (
  page: Page,
  event: 'updateStoryArgs' | 'updateGlobals',
  payload: Record<string, unknown>,
) => {
  await page.evaluate(
    ([eventName, eventPayload]) =>
      new Promise<void>((resolve) => {
        const channel = (window as unknown as TStorybookWindow)
          .__STORYBOOK_ADDONS_CHANNEL__;
        const onRendered = () => {
          channel.off('storyRendered', onRendered);
          resolve();
        };
        channel.on('storyRendered', onRendered);
        channel.emit(eventName, eventPayload);
      }),
    [event, payload] as const,
  );
  await settle(page);
};
