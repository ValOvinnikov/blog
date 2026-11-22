export type TEmailCssRules = Record<string, Record<string, string>>;

const NARROW_SCREEN_MAX_WIDTH_PX = 480;

function renderRules(rules: TEmailCssRules): string {
  return Object.entries(rules)
    .map(([className, declarations]) => {
      const body = Object.entries(declarations)
        .map(([property, value]) => `${property}:${value} !important;`)
        .join('');
      return `.${className}{${body}}`;
    })
    .join('');
}

// A `<style>` block only enhances: clients that strip it keep the inline light, desktop styles, so every rule must override an inline one.
export function renderDarkModeCss(rules: TEmailCssRules): string {
  return `@media (prefers-color-scheme: dark){${renderRules(rules)}}`;
}

export function renderNarrowScreenCss(rules: TEmailCssRules): string {
  return `@media only screen and (max-width:${NARROW_SCREEN_MAX_WIDTH_PX}px){${renderRules(rules)}}`;
}
