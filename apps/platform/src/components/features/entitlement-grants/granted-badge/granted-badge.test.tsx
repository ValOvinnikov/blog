import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { MOCK_TENANT_CREATED_AT } from '@platform/testing/tenants/fixtures';
import { formatDate } from '@platform/utils/format-date/format-date';
import { LOCALE_ISO_CODES } from '@shinefold/config';

import { GrantedBadge } from './granted-badge';

const t = makeEnTranslator('grantedBadge');

const setup = customRender(GrantedBadge, { expiresAt: null });

describe(`<${GrantedBadge.name}/>`, () => {
  it('says only that it is granted when the grant never expires', () => {
    setup();

    const badge = screen.getByText(t('label'));

    expect(badge).toBeVisible();
  });

  it('says until when it is granted when the grant expires', () => {
    setup({ expiresAt: MOCK_TENANT_CREATED_AT });

    const badge = screen.getByText(
      t('labelUntil', {
        date: formatDate(MOCK_TENANT_CREATED_AT, LOCALE_ISO_CODES.EN),
      }),
    );

    expect(badge).toBeVisible();
  });
});
