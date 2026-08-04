import { toSessionUsername } from './to-session-username';

describe(toSessionUsername, () => {
  it('prefers the email local part when email is present', () => {
    expect(toSessionUsername('Val Ovinnikov', 'val@example.com')).toBe('val');
  });

  it('falls back to a slug of name when email is absent', () => {
    expect(toSessionUsername('Val Ovinnikov', undefined)).toBe('valovinnikov');
  });

  it('falls back to the generic "user" noun when both are absent', () => {
    expect(toSessionUsername(undefined, undefined)).toBe('user');
  });

  it('falls through to name when the email has an empty local part', () => {
    expect(toSessionUsername('Val Ovinnikov', '@example.com')).toBe(
      'valovinnikov',
    );
  });

  it('falls through to the "user" fallback when the email local part is empty and name is absent', () => {
    expect(toSessionUsername(undefined, '@example.com')).toBe('user');
  });

  it('falls through to the "user" fallback when name is whitespace-only and email is absent', () => {
    expect(toSessionUsername('   ', undefined)).toBe('user');
  });

  it('falls through to the "user" fallback when both are empty/whitespace-only', () => {
    expect(toSessionUsername('   ', '@example.com')).toBe('user');
  });
});
