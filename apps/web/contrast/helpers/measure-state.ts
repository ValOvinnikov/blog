import type { TMaybeNull } from '@blog/config';
import type { CDPSession, Page } from '@playwright/test';

import { collectEdgeTargets, FOCUSABLE_SELECTOR } from './collect-edge-targets';
import {
  collectTextTargets,
  INTERACTIVE_SELECTOR,
} from './collect-text-targets';
import { decodePng, type TPixels } from './decode-png';
import { forcePseudoState } from './force-pseudo-state';
import {
  measureEdge,
  measureText,
  type TMeasurement,
} from './measure-contrast';

export type TFailure = TMeasurement & {
  kind: 'text' | 'text-hover' | 'focus' | 'boundary';
};

const HIDE_TEXT_CSS = `*, *::before, *::after, *::placeholder, *::marker {
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  text-shadow: none !important;
  text-decoration-color: transparent !important;
}`;

const screenshotWithoutText = async (
  page: Page,
  cdp: CDPSession,
): Promise<TPixels> => {
  const style = await page.addStyleTag({ content: HIDE_TEXT_CSS });
  const { width, height } = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight,
  }));
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    optimizeForSpeed: true,
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height, scale: 1 },
  });
  await style.evaluate((element) => (element as HTMLStyleElement).remove());
  return decodePng(Buffer.from(data, 'base64'));
};

const failing = (
  kind: TFailure['kind'],
  measurements: TMaybeNull<TMeasurement>[],
): TFailure[] =>
  measurements.flatMap((measurement) =>
    measurement && measurement.ratio < measurement.minimum
      ? [{ ...measurement, kind }]
      : [],
  );

export const measureState = async (
  page: Page,
  cdp: CDPSession,
): Promise<TFailure[]> => {
  const restTexts = await page.evaluate(collectTextTargets, null);
  const boundaries = await page.evaluate(collectEdgeTargets, {
    kind: 'boundary' as const,
    focusableSelector: FOCUSABLE_SELECTOR,
  });
  const restPixels = await screenshotWithoutText(page, cdp);

  const releaseFocus = await forcePseudoState(page, cdp, {
    selector: FOCUSABLE_SELECTOR,
    pseudoClasses: ['focus', 'focus-visible'],
    includeAncestors: false,
  });
  const focusRings = await page.evaluate(collectEdgeTargets, {
    kind: 'focus' as const,
    focusableSelector: FOCUSABLE_SELECTOR,
  });
  await releaseFocus();

  const releaseHover = await forcePseudoState(page, cdp, {
    selector: INTERACTIVE_SELECTOR,
    pseudoClasses: ['hover'],
    includeAncestors: true,
  });
  const hoverTexts = await page.evaluate(
    collectTextTargets,
    INTERACTIVE_SELECTOR,
  );
  const hoverPixels = await screenshotWithoutText(page, cdp);
  await releaseHover();

  const restFailures = failing(
    'text',
    restTexts.map((target) => measureText(restPixels, target)),
  );
  const failingAtRest = new Set(restFailures.map(({ path }) => path));
  return [
    ...restFailures,
    ...failing(
      'text-hover',
      hoverTexts
        .filter(({ path }) => !failingAtRest.has(path))
        .map((target) => measureText(hoverPixels, target)),
    ),
    ...failing(
      'focus',
      focusRings.map((target) => measureEdge(restPixels, target)),
    ),
    ...failing(
      'boundary',
      boundaries.map((target) => measureEdge(restPixels, target)),
    ),
  ];
};
