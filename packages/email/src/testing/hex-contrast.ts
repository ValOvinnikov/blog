import { hexToOklch, renderedContrastRatio } from '@shinefold/utils/color';

export function hexContrast(foreground: string, background: string): number {
  return renderedContrastRatio(hexToOklch(foreground), [
    hexToOklch(background),
  ]);
}
