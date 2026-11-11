import { BUTTON_SHAPE, NAV_LINK_STYLE } from '@blog/config';
import messages from '@platform/i18n/messages/en.json';
import { renderHookWithIntl } from '@platform/testing/custom-render';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

import { useLookDraftFields } from './use-look-draft-fields';

const { lookForm: LOOK_FORM } = messages;

describe(useLookDraftFields, () => {
  it.each([
    {
      id: 'buttonShape',
      value: BUTTON_SHAPE.PILL,
      label: LOOK_FORM.buttonShapeLabel,
      reads: LOOK_FORM.buttonShapeOptionLabel.PILL,
    },
    {
      id: 'navLinkStyle',
      value: NAV_LINK_STYLE.UNDERLINE,
      label: LOOK_FORM.navLinkStyleLabel,
      reads: LOOK_FORM.navLinkStyleOptionLabel.UNDERLINE,
    },
  ] as const)(
    'names the $id field and reads the chosen value back',
    ({ id, value, label, reads }) => {
      const { result } = renderHookWithIntl(() => useLookDraftFields());

      const field = result.current.find((draftField) => draftField.id === id);

      expect(field?.label).toBe(label);
      expect(field?.display({ ...defaultLookFormValues(), [id]: value })).toBe(
        reads,
      );
    },
  );
});
