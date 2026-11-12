import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';
import { MOCK_EMAIL_DETAILS } from '@blog/email/testing/owner-email';

import { detailsAsPlainText, renderEmailDetails } from './email-details';

const [MOCK_FIRST_DETAIL, MOCK_SECOND_DETAIL] = MOCK_EMAIL_DETAILS;

describe(renderEmailDetails, () => {
  const html = renderEmailDetails(MOCK_EMAIL_DETAILS);
  const rows = html.split('</tr>');

  it.each(MOCK_EMAIL_DETAILS)(
    'renders $label and its value in the same row',
    ({ label, value }) => {
      expect(rows.find((row) => row.includes(label))).toContain(value);
    },
  );

  it('escapes every label and value', () => {
    const unsafeHtml = renderEmailDetails([
      { label: MOCK_UNSAFE_MARKUP, value: MOCK_UNSAFE_MARKUP },
    ]);

    expect(unsafeHtml).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(unsafeHtml).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });
});

describe(detailsAsPlainText, () => {
  it('puts each detail on its own line', () => {
    expect(detailsAsPlainText(MOCK_EMAIL_DETAILS)).toBe(
      `${MOCK_FIRST_DETAIL?.label}: ${MOCK_FIRST_DETAIL?.value}\n${MOCK_SECOND_DETAIL?.label}: ${MOCK_SECOND_DETAIL?.value}`,
    );
  });

  it('keeps a multi-line label or value on its one line', () => {
    expect(
      detailsAsPlainText([
        {
          label: `${MOCK_FIRST_DETAIL?.label}\n${MOCK_SECOND_DETAIL?.label}`,
          value: `${MOCK_FIRST_DETAIL?.value}\r\n${MOCK_SECOND_DETAIL?.value}`,
        },
      ]),
    ).toBe(
      `${MOCK_FIRST_DETAIL?.label} ${MOCK_SECOND_DETAIL?.label}: ${MOCK_FIRST_DETAIL?.value} ${MOCK_SECOND_DETAIL?.value}`,
    );
  });
});
