import {
  HUE_MAX,
  HUE_MIN,
  PRESET_ID,
  PRESET_REGISTRY,
  type TPresetId,
} from '@blog/config';
import type { Decorator, Preview } from '@storybook/nextjs-vite';
import { resolveFontVariableClassName } from '@web/config/fonts';
import { buildThemeStyleBlock } from '@web/utils/build-theme-style-block';

const THEME_STYLE_ID = 'storybook-site-theme';
const PRESET_HUE = 'PRESET';
const HUE_STEP = 10;

const resolvePresetFontClassNames = (presetId: TPresetId): string[] => {
  const { headingFont, bodyFont } = PRESET_REGISTRY[presetId].themeTokens;
  return resolveFontVariableClassName(headingFont, bodyFont).split(' ');
};

const ensureThemeStyle = (): HTMLStyleElement => {
  const existing = document.getElementById(THEME_STYLE_ID);
  if (existing instanceof HTMLStyleElement) return existing;
  const style = document.createElement('style');
  style.id = THEME_STYLE_ID;
  document.head.append(style);
  // Storybook appends stylesheets as stories load; the overrides only win while they come last.
  new MutationObserver(() => {
    if (document.head.lastElementChild !== style) document.head.append(style);
  }).observe(document.head, { childList: true });
  return style;
};

export const SITE_THEME_GLOBAL_TYPES: Preview['globalTypes'] = {
  preset: {
    description: 'Preset',
    toolbar: {
      title: 'Preset',
      icon: 'paintbrush',
      items: Object.values(PRESET_ID),
      dynamicTitle: true,
    },
  },
  accentHue: {
    description: 'Accent hue',
    toolbar: {
      title: 'Hue',
      icon: 'circle',
      items: [
        { value: PRESET_HUE, title: 'Preset hue' },
        ...Array.from({ length: HUE_MAX / HUE_STEP }, (_, index) => ({
          value: String(index * HUE_STEP),
          title: `Hue ${index * HUE_STEP}`,
        })),
      ],
      dynamicTitle: true,
    },
  },
  colorMode: {
    description: 'Colour mode',
    toolbar: {
      title: 'Mode',
      icon: 'mirror',
      items: ['light', 'dark'],
      dynamicTitle: true,
    },
  },
};

export const SITE_THEME_INITIAL_GLOBALS = {
  preset: PRESET_ID.CONSOLE,
  accentHue: PRESET_HUE,
  colorMode: 'light',
};

// The class names go on the root element, not a wrapper div: the
// `--font-*-family` custom properties are read on `body`, which doesn't
// inherit them from a descendant.
export const withSiteTheme: Decorator = (storyFn, { globals }) => {
  const presetId =
    globals.preset === PRESET_ID.EDITORIAL
      ? PRESET_ID.EDITORIAL
      : PRESET_ID.CONSOLE;
  const { themeTokens, cardStyle } = PRESET_REGISTRY[presetId];
  const hue = Number(globals.accentHue);
  const accentHue =
    Number.isInteger(hue) && hue >= HUE_MIN && hue < HUE_MAX
      ? hue
      : themeTokens.accentHue;
  ensureThemeStyle().textContent = buildThemeStyleBlock({
    ...themeTokens,
    cardStyle,
    accentHue,
  });

  const { classList } = document.documentElement;
  Object.values(PRESET_ID).forEach((id) => {
    classList.remove(...resolvePresetFontClassNames(id));
  });
  classList.add(...resolvePresetFontClassNames(presetId));
  classList.toggle('dark', globals.colorMode === 'dark');
  return storyFn();
};
