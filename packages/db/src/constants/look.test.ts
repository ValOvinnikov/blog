import { siteConfig } from '@blog/db/schema/site-config';
import { getTableColumns } from 'drizzle-orm';

import { LOOK_FIELDS } from './look';

const NON_LOOK_COLUMNS = [
  'id',
  'tenantId',
  'voiceOverridesByLocale',
  'createdAt',
  'updatedAt',
];

describe('LOOK_FIELDS', () => {
  it('names every site_config column outside Voice and the row bookkeeping', () => {
    const lookColumns = Object.keys(getTableColumns(siteConfig)).filter(
      (column) => !NON_LOOK_COLUMNS.includes(column),
    );

    expect([...LOOK_FIELDS].sort()).toEqual(lookColumns.sort());
  });
});
