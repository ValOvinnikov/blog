import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import {
  BLOCK_AUTHOR_EMAIL,
  BLOCK_REASON,
  BLOCKED_ADDRESS_ENTRY_ID,
  BLOCKED_ADDRESS_HASH_PREVIEW,
  BLOCKED_DOMAIN,
  makeBlockedSignupEntry,
} from '@platform/testing/blocked-signups/fixtures';
import { customRender, screen, within } from '@platform/testing/custom-render';

import { BlockedSignupsView } from './blocked-signups-view';

vi.mock('@platform/server/signup-block/add-blocked-domain-action', () => ({
  addBlockedDomainAction: vi.fn(),
}));

vi.mock('@platform/server/signup-block/remove-blocked-identity-action', () => ({
  removeBlockedIdentityAction: vi.fn(),
}));

const ADDRESS_ENTRY = makeBlockedSignupEntry({
  id: BLOCKED_ADDRESS_ENTRY_ID,
  kind: BLOCKED_IDENTITY_KIND.ADDRESS,
  displayValue: BLOCKED_ADDRESS_HASH_PREVIEW,
  reason: `${BLOCK_REASON} again`,
  addedBy: null,
});

const setup = customRender(BlockedSignupsView, {
  entries: [makeBlockedSignupEntry(), ADDRESS_ENTRY],
});

describe(`<${BlockedSignupsView.name}/>`, () => {
  it('shows each entry with its value, reason and author', () => {
    setup();

    const domainRow = screen.getByRole('row', {
      name: new RegExp(BLOCKED_DOMAIN),
    });
    const addressRow = screen.getByRole('row', {
      name: new RegExp(BLOCKED_ADDRESS_HASH_PREVIEW),
    });

    const domainReason = within(domainRow).getByText(BLOCK_REASON);
    const domainAuthor = within(domainRow).getByText(BLOCK_AUTHOR_EMAIL);
    const addressKind = within(addressRow).getByText('Email address');
    const addressAuthor = within(addressRow).queryByText(BLOCK_AUTHOR_EMAIL);

    expect(domainReason).toBeVisible();
    expect(domainAuthor).toBeVisible();
    expect(addressKind).toBeVisible();
    expect(addressAuthor).not.toBeInTheDocument();
  });

  it('offers a removal control for every entry', () => {
    setup();

    const removeDomain = screen.getByRole('button', {
      name: `Remove block ${BLOCKED_DOMAIN}`,
    });
    const removeAddress = screen.getByRole('button', {
      name: `Remove block ${BLOCKED_ADDRESS_HASH_PREVIEW}`,
    });

    expect(removeDomain).toBeVisible();
    expect(removeAddress).toBeVisible();
  });

  it('says nothing is blocked when the list is empty', () => {
    setup({ entries: [] });

    const empty = screen.getByText('Nothing is blocked.');

    expect(empty).toBeVisible();
  });

  it('offers a form to block a domain', () => {
    setup();

    const submit = screen.getByRole('button', { name: 'Block domain' });

    expect(submit).toBeVisible();
  });
});
