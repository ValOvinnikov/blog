import { MOCK_WORKFLOW_CRASH } from '@worker/testing/outage/fixtures';

import { errorMessage } from './error-message';

describe(errorMessage, () => {
  it("reads an error's message", () => {
    expect(errorMessage(new Error(MOCK_WORKFLOW_CRASH))).toBe(
      MOCK_WORKFLOW_CRASH,
    );
  });

  it('spells out a thrown value that is not an error', () => {
    expect(errorMessage(MOCK_WORKFLOW_CRASH)).toBe(MOCK_WORKFLOW_CRASH);
  });
});
