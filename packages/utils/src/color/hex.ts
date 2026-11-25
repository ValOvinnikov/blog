const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}
