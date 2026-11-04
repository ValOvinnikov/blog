import { faker } from '@faker-js/faker';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import type { ReactNode } from 'react';

import { revealFirstInvalidControl } from './reveal-first-invalid-control';

faker.seed(6424);

const MOCK_FIELD_ID = faker.string.alpha(10);
const MOCK_FIELD_LABEL = faker.lorem.word();

describe(revealFirstInvalidControl, () => {
  it.each<{ fieldKind: string; field: ReactNode }>([
    {
      fieldKind: 'the field itself',
      field: <input id={MOCK_FIELD_ID} aria-label={MOCK_FIELD_LABEL} />,
    },
    {
      fieldKind: 'the control inside a field that cannot take focus',
      field: (
        <div id={MOCK_FIELD_ID}>
          <input aria-label={MOCK_FIELD_LABEL} />
        </div>
      ),
    },
  ])('focuses $fieldKind', ({ field }) => {
    renderWithIntl(field);

    revealFirstInvalidControl({ ids: [MOCK_FIELD_ID] });

    const firstField = screen.getByRole('textbox', { name: MOCK_FIELD_LABEL });
    expect(firstField).toHaveFocus();
  });

  it('reveals nothing when no control is invalid', () => {
    const revealFirst = vi.fn();

    revealFirstInvalidControl({ ids: [], revealFirst });

    expect(revealFirst).not.toHaveBeenCalled();
  });
});
