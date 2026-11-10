import { BUTTON_SHAPE } from '@blog/config';
import messages from '@platform/i18n/messages/en.json';
import { renderHookWithIntl } from '@platform/testing/custom-render';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

import { useLookDraftFields } from './use-look-draft-fields';

const { lookForm: LOOK_FORM } = messages;

describe(useLookDraftFields, () => {
  it('names the button shape field Shape and reads the chosen shape back', () => {
    const { result } = renderHookWithIntl(() => useLookDraftFields());

    const shapeField = result.current.find(({ id }) => id === 'buttonShape');

    expect(shapeField?.label).toBe(LOOK_FORM.buttonShapeLabel);
    expect(
      shapeField?.display({
        ...defaultLookFormValues(),
        buttonShape: BUTTON_SHAPE.PILL,
      }),
    ).toBe(LOOK_FORM.buttonShapeOptionLabel.PILL);
  });
});
