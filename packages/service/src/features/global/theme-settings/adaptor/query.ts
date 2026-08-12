import { q } from '@blog/service/sanity/query';

// `settings_theme` is a tenant-optional singleton — a fresh dataset has no
// document yet, so the whole projection (and every field on it) is nullable;
// the resolver falls back to the console preset when it's absent.
export const themeSettingsQuery = q.star
  .filterByType('settings_theme')
  .slice(0)
  .project((sub) => ({
    // `preset` is `rule.required()` in the schema, but stays `.nullable(true)`
    // deliberately: console is the safety net, so any missing/unexpected value
    // falls back to it in the transformer rather than throwing.
    preset: sub.field('preset').nullable(true),
    accentHue: sub.field('accentHue').nullable(true),
    logoHue: sub.field('logoHue').nullable(true),
    headingFont: sub.field('headingFont').nullable(true),
    bodyFont: sub.field('bodyFont').nullable(true),
    radiusScale: sub.field('radiusScale').nullable(true),
    density: sub.field('density').nullable(true),
  }))
  .nullable(true);
