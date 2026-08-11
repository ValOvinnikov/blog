import { oklchToHex } from './oklch';

describe('oklchToHex', () => {
  it('reproduces the Console light --logo-1 hex from theme.css', () => {
    expect(oklchToHex(0.52, 0.17, 250)).toBe('#006ac5');
  });

  it('reproduces the Console dark --logo-3 hex from theme.css', () => {
    expect(oklchToHex(0.8, 0.14, 250)).toBe('#73c3ff');
  });

  it('reproduces the Indigo light --logo-alt-2 hex from theme.css', () => {
    expect(oklchToHex(0.58, 0.21, 274)).toBe('#5966f3');
  });
});
