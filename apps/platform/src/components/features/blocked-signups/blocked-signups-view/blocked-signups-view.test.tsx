import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import {
  MOCK_BLOCK_AUTHOR_EMAIL,
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_ADDRESS_ENTRY_ID,
  MOCK_BLOCKED_ADDRESS_HASH_PREVIEW,
  MOCK_BLOCKED_DOMAIN,
  mockBlockedSignupEntry,
} from '@platform/testing/blocked-signups/fixtures';
import { customRender, screen, within } from '@platform/testing/custom-render';

import { BlockedSignupsView } from './blocked-signups-view';

vi.mock('@platform/server/signup-block/add-blocked-domain-action', () => ({
  addBlockedDomainAction: vi.fn(),
}));

vi.mock('@platform/server/signup-block/remove-blocked-identity-action', () => ({
  removeBlockedIdentityAction: vi.fn(),
}));

const ADDRESS_ENTRY = mockBlockedSignupEntry({
  id: MOCK_BLOCKED_ADDRESS_ENTRY_ID,
  kind: BLOCKED_IDENTITY_KIND.ADDRESS,
  displayValue: MOCK_BLOCKED_ADDRESS_HASH_PREVIEW,
  reason: `${MOCK_BLOCK_REASON} again`,
  addedBy: null,
});

const setup = customRender(BlockedSignupsView, {
  entries: [mockBlockedSignupEntry(), ADDRESS_ENTRY],
});

describe(`<${BlockedSignupsView.name}/>`, () => {
  describe('with entries', () => {
    beforeEach(() => {
      setup();
    });

    it('shows each entry with its value, reason and author', () => {
      const domainRow = screen.getByRole('row', {
        name: new RegExp(MOCK_BLOCKED_DOMAIN),
      });
      const addressRow = screen.getByRole('row', {
        name: new RegExp(MOCK_BLOCKED_ADDRESS_HASH_PREVIEW),
      });

      const domainReason = within(domainRow).getByText(MOCK_BLOCK_REASON);
      const domainAuthor = within(domainRow).getByText(MOCK_BLOCK_AUTHOR_EMAIL);
      const addressKind = within(addressRow).getByText('Email address');
      const addressAuthor = within(addressRow).queryByText(
        MOCK_BLOCK_AUTHOR_EMAIL,
      );

      expect(domainReason).toBeVisible();
      expect(domainAuthor).toBeVisible();
      expect(addressKind).toBeVisible();
      expect(addressAuthor).not.toBeInTheDocument();
    });

    it('offers a removal control for every entry', () => {
      const removeDomain = screen.getByRole('button', {
        name: `Remove block ${MOCK_BLOCKED_DOMAIN}`,
      });
      const removeAddress = screen.getByRole('button', {
        name: `Remove block ${MOCK_BLOCKED_ADDRESS_HASH_PREVIEW}`,
      });

      expect(removeDomain).toBeVisible();
      expect(removeAddress).toBeVisible();
    });

    it('offers a form to block a domain', () => {
      const submit = screen.getByRole('button', { name: 'Block domain' });

      expect(submit).toBeVisible();
    });
  });

  describe('without entries', () => {
    beforeEach(() => {
      setup({ entries: [] });
    });

    it('says nothing is blocked when the list is empty', () => {
      const empty = screen.getByText('Nothing is blocked.');

      expect(empty).toBeVisible();
    });
  });
});
