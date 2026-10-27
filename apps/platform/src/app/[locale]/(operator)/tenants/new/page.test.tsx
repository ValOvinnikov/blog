import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';

import NewTenantPage from './page';

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/tenants/create-tenant-action', () => ({
  createTenantAction: vi.fn(),
}));

const t = makeEnTranslator('addTenantWizard');

const setup = customRender(NewTenantPage, {});

describe(`<${NewTenantPage.name}/>`, () => {
  it('opens the add-tenant wizard', () => {
    setup();

    const pageHeading = screen.getByRole('heading', {
      level: 1,
      name: t('heading'),
    });

    expect(pageHeading).toBeVisible();
  });
});
