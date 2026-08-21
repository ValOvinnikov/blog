import { DEPTH, type TDepth } from '@blog/config';

/** `localStorage` key the reading-depth choice persists under — shared by `DepthProvider` and the bootstrap script below so there is exactly one literal. */
export const DEPTH_STORAGE_KEY = 'reading-depth';

export interface IDepthAvailability {
  hasSkim: boolean;
  hasDeep: boolean;
}

/**
 * The depths a *given* post actually supports — `READ` always; `SKIM`/`DEEP`
 * only when the post has an approved skim / authored asides. A depth stored
 * in `localStorage` from a *previous* post (e.g. `SKIM`) is not necessarily
 * valid for the post being rendered now — restoring it unconditionally would
 * strand the reader on a post with no skim and no way back to `READ` (the
 * `DepthToggle` itself would render nothing, since neither option applies).
 */
const allowedDepths = ({ hasSkim, hasDeep }: IDepthAvailability): TDepth[] => {
  return [
    DEPTH.READ,
    ...(hasSkim ? [DEPTH.SKIM] : []),
    ...(hasDeep ? [DEPTH.DEEP] : []),
  ];
};

/**
 * Builds the inline reading-depth bootstrap script, run before hydration to
 * avoid a flash of the default `READ` view for a returning `SKIM`/`DEEP`
 * reader. Mirrors `theme-script.ts`'s mechanism: it targets the element it's
 * rendered inside via `document.currentScript` (`DepthProvider` places this
 * as the wrapper `<div>`'s first child), so it can stamp `data-depth` on
 * that wrapper synchronously, before the browser paints — pure CSS
 * (`group-data-[depth=…]` selectors keyed off the wrapper) then gates each
 * depth's markup with no further JS needed. Unlike the theme script, this
 * one is built per-render (not a static constant) — the current post's
 * `IDepthAvailability` decides which stored values are honored, so a
 * `SKIM`/`DEEP` choice persisted from a *different* post that doesn't
 * support it is treated the same as no stored value at all (falls back to
 * `READ`) rather than stamped onto this post's DOM.
 */
export const buildDepthBootstrapScript = (
  availability: IDepthAvailability,
): string => {
  const valid = JSON.stringify(allowedDepths(availability));

  return (
    `(function(){try{var s=localStorage.getItem('${DEPTH_STORAGE_KEY}');` +
    `var valid=${valid};` +
    `if(s&&valid.indexOf(s)!==-1){var el=document.currentScript&&document.currentScript.parentElement;` +
    `if(el)el.setAttribute('data-depth',s)}}catch(e){}})()`
  );
};

/**
 * Reads the persisted depth choice and clamps it to what the current post
 * actually supports — the same rule `buildDepthBootstrapScript` applies
 * pre-hydration, re-applied here so `useDepth()` consumers (state, not just
 * the DOM attribute) never end up on an unsupported depth either.
 */
export const readStoredDepth = (availability: IDepthAvailability): TDepth => {
  try {
    const stored = localStorage.getItem(DEPTH_STORAGE_KEY);
    const valid = allowedDepths(availability) as string[];
    return stored !== null && valid.includes(stored)
      ? (stored as TDepth)
      : DEPTH.READ;
  } catch {
    // localStorage can throw in private browsing — fall back to the default.
    return DEPTH.READ;
  }
};
