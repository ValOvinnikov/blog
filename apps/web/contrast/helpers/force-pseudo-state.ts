import type { TMaybeNull } from '@blog/config';
import type { CDPSession, Page } from '@playwright/test';

const FORCED_ATTRIBUTE = 'data-contrast-forced';

export const forcePseudoState = async (
  page: Page,
  cdp: CDPSession,
  {
    selector,
    pseudoClasses,
    includeAncestors,
  }: { selector: string; pseudoClasses: string[]; includeAncestors: boolean },
): Promise<() => Promise<void>> => {
  await page.evaluate(
    ([targetSelector, attribute, withAncestors]) => {
      document.body.querySelectorAll(targetSelector).forEach((element) => {
        for (
          let current: TMaybeNull<Element> = element;
          current && current !== document.documentElement;
          current = withAncestors ? current.parentElement : null
        ) {
          current.setAttribute(attribute, '');
        }
      });
    },
    [selector, FORCED_ATTRIBUTE, includeAncestors] as const,
  );
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', {
    nodeId: root.nodeId,
    selector: `[${FORCED_ATTRIBUTE}]`,
  });
  const setForced = (forcedPseudoClasses: string[]) =>
    Promise.all(
      nodeIds.map((nodeId) =>
        cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses }),
      ),
    );
  await setForced(pseudoClasses);

  return async () => {
    await setForced([]);
    await page.evaluate((attribute) => {
      document.querySelectorAll(`[${attribute}]`).forEach((element) => {
        element.removeAttribute(attribute);
      });
    }, FORCED_ATTRIBUTE);
  };
};
