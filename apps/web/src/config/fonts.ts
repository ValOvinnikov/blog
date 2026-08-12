import { FONT_CHOICE, type TFontChoice } from '@blog/config';

type TFontModule = { variable: string };
type TFontLoader = () => Promise<TFontModule>;

const DEFAULT_HEADING_FONT_LOADER: TFontLoader = () =>
  import('./font-loaders/space-grotesk-font').then((m) => m.spaceGrotesk);
const DEFAULT_BODY_FONT_LOADER: TFontLoader = () =>
  import('./font-loaders/newsreader-font').then((m) => m.newsreader);

const HEADING_FONT_LOADERS: Partial<Record<TFontChoice, TFontLoader>> = {
  [FONT_CHOICE.SPACE_GROTESK]: DEFAULT_HEADING_FONT_LOADER,
  [FONT_CHOICE.FRAUNCES]: () =>
    import('./font-loaders/fraunces-font').then((m) => m.fraunces),
};

const BODY_FONT_LOADERS: Partial<Record<TFontChoice, TFontLoader>> = {
  [FONT_CHOICE.NEWSREADER]: DEFAULT_BODY_FONT_LOADER,
  [FONT_CHOICE.INTER]: () =>
    import('./font-loaders/inter-font').then((m) => m.inter),
};

/**
 * Resolves the `next/font` CSS variable classes to apply to `<html>` for the
 * given theme tokens' `headingFont`/`bodyFont`. Each candidate font is
 * defined in its own module under `font-loaders/` and only dynamically
 * imported once its `TFontChoice` is actually resolved here — every other
 * candidate's `next/font/google` call never executes for this render, so
 * only the selected heading/body fonts (plus the always-on `jetbrainsMono`,
 * backing `--font-ui`) are bundled and preloaded, never all five at once.
 * Falls back to the Console picks (`spaceGrotesk`/`newsreader`) for any
 * `TFontChoice` not mapped to its role (e.g. a mono choice picked for
 * `headingFont`).
 *
 * @example
 * await resolveFontVariableClassName('FRAUNCES', 'INTER') // '--font-display-family --font-body-family --font-mono-family' classes
 */
export async function resolveFontVariableClassName(
  headingFont: TFontChoice,
  bodyFont: TFontChoice,
): Promise<string> {
  const headingLoader =
    HEADING_FONT_LOADERS[headingFont] ?? DEFAULT_HEADING_FONT_LOADER;
  const bodyLoader = BODY_FONT_LOADERS[bodyFont] ?? DEFAULT_BODY_FONT_LOADER;

  const [heading, body, mono] = await Promise.all([
    headingLoader(),
    bodyLoader(),
    import('./font-loaders/jetbrains-mono-font').then((m) => m.jetbrainsMono),
  ]);

  return `${heading.variable} ${body.variable} ${mono.variable}`;
}
