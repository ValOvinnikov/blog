import { toSharedLinkId } from './id';

describe('toSharedLinkId', () => {
  it('prefixes the containing document id with shared_link- and appends the suffix', () => {
    expect(toSharedLinkId('settings_navigation', 'items-0')).toBe(
      'shared_link-settings_navigation-items-0',
    );
  });

  it('keeps the drafts. prefix outermost for a draft document', () => {
    expect(toSharedLinkId('drafts.settings_footer', 'social-0')).toBe(
      'drafts.shared_link-settings_footer-social-0',
    );
  });
});
