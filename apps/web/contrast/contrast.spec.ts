import { BRAND_VARIANT } from '@blog/config/constants';
import { expect, test } from '@playwright/test';

import {
  entriesForCase,
  isUpdatingBaseline,
  readBaseline,
  writeBaselinePart,
} from './helpers/baseline';
import { installContrastProbe } from './helpers/contrast-probe';
import { measureState } from './helpers/measure-state';
import { openStory, updateStory } from './helpers/storybook-page';
import {
  listModuleStoryIds,
  serveStorybookStatic,
} from './helpers/storybook-static';
import {
  COLOR_MODES,
  INITIAL_GLOBALS,
  THEME_CASES,
  type TSiteThemeGlobals,
  VIEWPORT_WIDTHS,
} from './helpers/theme-cases';

const VIEWPORT_HEIGHT = 900;
const baseline = readBaseline();

for (const storyId of listModuleStoryIds()) {
  for (const brandVariant of Object.values(BRAND_VARIANT)) {
    for (const width of VIEWPORT_WIDTHS) {
      const casePrefix = `${storyId} | ${brandVariant} | ${width}px | `;

      test(casePrefix.slice(0, -3), async ({ page }) => {
        await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
        await page.addInitScript(installContrastProbe);
        await serveStorybookStatic(page);
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('DOM.enable');
        await cdp.send('CSS.enable');

        await openStory(page, storyId);
        await updateStory(page, 'updateStoryArgs', {
          storyId,
          updatedArgs: { brandVariant },
        });

        let globals = INITIAL_GLOBALS;
        const found: string[] = [];
        const details: string[] = [];
        for (const { name, preset, accentHue } of THEME_CASES) {
          for (const colorMode of COLOR_MODES) {
            const nextGlobals: TSiteThemeGlobals = {
              preset,
              accentHue,
              colorMode,
            };
            if (JSON.stringify(nextGlobals) !== JSON.stringify(globals)) {
              globals = nextGlobals;
              await updateStory(page, 'updateGlobals', { globals });
            }
            for (const failure of await measureState(page, cdp)) {
              const key = `${casePrefix}${name} | ${colorMode} | ${failure.kind} | ${failure.path}`;
              if (found.includes(key)) continue;
              found.push(key);
              details.push(
                `${key} — ${failure.ratio.toFixed(2)}:1 < ${failure.minimum}:1 "${failure.snippet}"`,
              );
            }
          }
        }

        if (isUpdatingBaseline()) {
          writeBaselinePart(casePrefix, found);
          return;
        }
        const expected = entriesForCase(baseline, casePrefix);
        const regressions = details.filter(
          (detail) =>
            !expected.some((entry) => detail.startsWith(`${entry} — `)),
        );
        const nowPassing = expected.filter((entry) => !found.includes(entry));
        expect(
          regressions,
          'New contrast failures — fix them (or, for a deliberate baseline reset, rerun with CONTRAST_UPDATE_BASELINE=1)',
        ).toEqual([]);
        expect(
          nowPassing,
          'Baseline entries that now pass — remove them from contrast/baseline.json',
        ).toEqual([]);
      });
    }
  }
}
