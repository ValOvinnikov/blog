import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';
import { MOCK_EMAIL_DETAILS } from '@blog/email/testing/owner-email';

import { detailsAsPlainText, renderEmailDetails } from './email-details';

const [MOCK_FIRST_DETAIL, MOCK_SECOND_DETAIL] = MOCK_EMAIL_DETAILS;

describe(renderEmailDetails, () => {
  it.each(MOCK_EMAIL_DETAILS)(
    'renders $label and its value in one row',
    ({ label, value }) => {
      expect(renderEmailDetails(MOCK_EMAIL_DETAILS)).toContain(
        `${label}</td><td align="right"`,
      );
      expect(renderEmailDetails(MOCK_EMAIL_DETAILS)).toContain(`${value}</td>`);
    },
  );

  it('escapes every label and value', () => {
    const html = renderEmailDetails([
      { label: MOCK_UNSAFE_MARKUP, value: MOCK_UNSAFE_MARKUP },
    ]);

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });
});

describe(detailsAsPlainText, () => {
  it('puts each detail on its own line', () => {
    expect(detailsAsPlainText(MOCK_EMAIL_DETAILS)).toBe(
      `${MOCK_FIRST_DETAIL?.label}: ${MOCK_FIRST_DETAIL?.value}\n${MOCK_SECOND_DETAIL?.label}: ${MOCK_SECOND_DETAIL?.value}`,
    );
  });
});
