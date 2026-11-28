import messages from '@platform/i18n/messages/en.json';
import {
  MOCK_BLOCK_AUTHOR_EMAIL,
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_ADDRESS_ENTRY_ID,
  MOCK_BLOCKED_ADDRESS_HASH_PREVIEW,
  MOCK_BLOCKED_DOMAIN,
  MOCK_BLOCKING_SUSPENSION,
  mockBlockedSignupEntry,
} from '@platform/testing/blocked-signups/fixtures';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { adminRoutes } from '@platform/utils/routes/routes';
import { BLOCKED_IDENTITY_KIND } from '@shinefold/db/constants';

import { BlockedSignupsView } from './blocked-signups-view';

vi.mock('@platform/server/signup-block/add-blocked-domain-action');

vi.mock('@platform/server/signup-block/remove-blocked-identity-action');

const { addBlockedDomainCard, blockedSignupsTable, blockedSignupKindLabel } =
  messages;
const t = makeEnTranslator('removeBlockedIdentityControl');

const MOCK_ADDRESS_BLOCK_REASON = `${MOCK_BLOCK_REASON} again`;
const MOCK_ADDRESS_ENTRY = mockBlockedSignupEntry({
  id: MOCK_BLOCKED_ADDRESS_ENTRY_ID,
  kind: BLOCKED_IDENTITY_KIND.ADDRESS,
  displayValue: MOCK_BLOCKED_ADDRESS_HASH_PREVIEW,
  reason: MOCK_ADDRESS_BLOCK_REASON,
  addedBy: null,
  suspension: MOCK_BLOCKING_SUSPENSION,
});

const setup = customRender(BlockedSignupsView, {
  entries: [mockBlockedSignupEntry(), MOCK_ADDRESS_ENTRY],
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
      const addressKind = within(addressRow).getByText(
        blockedSignupKindLabel.ADDRESS,
      );
      const addressAuthor = within(addressRow).queryByText(
        MOCK_BLOCK_AUTHOR_EMAIL,
      );

      expect(domainReason).toBeVisible();
      expect(domainAuthor).toBeVisible();
      expect(addressKind).toBeVisible();
      expect(addressAuthor).not.toBeInTheDocument();
    });

    it('names the suspension and links the site an owner block came from', () => {
      const addressRow = screen.getByRole('row', {
        name: new RegExp(MOCK_BLOCKED_ADDRESS_HASH_PREVIEW),
      });

      const reference = within(addressRow).getByText(
        new RegExp(MOCK_BLOCKING_SUSPENSION.reference),
      );
      const site = within(addressRow).getByRole('link', {
        name: MOCK_BLOCKING_SUSPENSION.tenantName,
      });

      expect(reference).toBeVisible();
      expect(site).toHaveAttribute(
        'href',
        expect.stringContaining(
          adminRoutes.tenantOverview(MOCK_BLOCKING_SUSPENSION.tenantId),
        ),
      );
    });

    it('offers a removal control for every entry', () => {
      const removeDomain = screen.getByRole('button', {
        name: t('triggerAriaLabel', { value: MOCK_BLOCKED_DOMAIN }),
      });
      const removeAddress = screen.getByRole('button', {
        name: t('triggerAriaLabel', {
          value: MOCK_BLOCKED_ADDRESS_HASH_PREVIEW,
        }),
      });

      expect(removeDomain).toBeVisible();
      expect(removeAddress).toBeVisible();
    });

    it('offers a form to block a domain', () => {
      const submit = screen.getByRole('button', {
        name: addBlockedDomainCard.blockSubmit,
      });

      expect(submit).toBeVisible();
    });
  });

  describe('without entries', () => {
    beforeEach(() => {
      setup({ entries: [] });
    });

    it('says nothing is blocked when the list is empty', () => {
      const empty = screen.getByText(blockedSignupsTable.empty);

      expect(empty).toBeVisible();
    });
  });
});
