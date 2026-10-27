import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import {
  ARCHIVED_NOTICE_DESCRIPTION,
  ARCHIVED_NOTICE_ID,
  ARCHIVED_NOTICE_TEXT,
} from '@platform/testing/render-in-settings-form';
import { MOCK_ARCHIVED_AT } from '@platform/testing/tenants/fixtures';

import { ArchivedTenantNotice } from './archived-tenant-notice';

faker.seed(5995);

const MOCK_CONTROL_LABEL = faker.lorem.word();

const setup = customRender(ArchivedTenantNotice, {
  archivedAt: MOCK_ARCHIVED_AT,
});

describe(`<${ArchivedTenantNotice.name}/>`, () => {
  it('renders a status notice titled with the archived state', () => {
    setup();

    const notice = screen.getByRole('status');
    const title = screen.getByText(ARCHIVED_NOTICE_TEXT);

    expect(notice).toBeVisible();
    expect(title).toBeVisible();
  });

  it('describes a control that references it by id, archive date included', () => {
    renderWithIntl(
      <>
        <ArchivedTenantNotice
          id={ARCHIVED_NOTICE_ID}
          archivedAt={MOCK_ARCHIVED_AT}
        />
        <button
          type="button"
          disabled={true}
          aria-describedby={ARCHIVED_NOTICE_ID}
        >
          {MOCK_CONTROL_LABEL}
        </button>
      </>,
    );

    const control = screen.getByRole('button', { name: MOCK_CONTROL_LABEL });

    expect(control).toHaveAccessibleDescription(ARCHIVED_NOTICE_DESCRIPTION);
  });
});
