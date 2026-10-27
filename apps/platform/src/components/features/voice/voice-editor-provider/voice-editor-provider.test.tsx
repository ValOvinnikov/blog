import { SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { act, renderHook } from '@platform/testing/custom-render';
import { MOCK_SITE_PREVIEW_THEME } from '@platform/testing/site-preview-theme';
import {
  buildVoiceDraft,
  localeDraftOf,
  withVoiceValue,
} from '@platform/utils/voice-draft/voice-draft';
import type { ReactNode } from 'react';

import {
  useVoiceEditor,
  useVoiceFieldState,
  VoiceEditorProvider,
} from './voice-editor-provider';

faker.seed(5994);

const { DE } = LOCALE_ISO_CODES;

const MOCK_FIELD_ID_PREFIX = faker.lorem.word();
const MOCK_VALUE = faker.lorem.word();
const MOCK_ERROR = faker.lorem.sentence();
const MOCK_CHANGE = faker.lorem.word();

const setFieldValue = vi.fn();

const savedValues = localeDraftOf(buildVoiceDraft({}, [DE]), DE);
const values = localeDraftOf(
  withVoiceValue(buildVoiceDraft({}, [DE]), DE, 'notFoundHeading', MOCK_VALUE),
  DE,
);

const Wrapper = ({ children }: { children: ReactNode }) => (
  <VoiceEditorProvider
    locale={DE}
    fieldIdPrefix={MOCK_FIELD_ID_PREFIX}
    values={values}
    savedValues={savedValues}
    errors={{ notFoundHeading: MOCK_ERROR }}
    openListFieldId={undefined}
    setOpenListFieldId={vi.fn()}
    setFieldValue={setFieldValue}
    specimenTheme={MOCK_SITE_PREVIEW_THEME}
  >
    {children}
  </VoiceEditorProvider>
);

describe(`<${VoiceEditorProvider.name}/>`, () => {
  it('throws when read outside a provider', () => {
    expect(() => renderHook(() => useVoiceEditor())).toThrow(
      'useVoiceEditor must be used within a VoiceEditorProvider',
    );
  });

  it("gives a field its value, saved value, error and the language's default", () => {
    const { result } = renderHook(() => useVoiceFieldState('notFoundHeading'), {
      wrapper: Wrapper,
    });
    const { inputId, value, savedValue, error, placeholder } = result.current;

    expect(inputId).toBe(`${MOCK_FIELD_ID_PREFIX}-notFoundHeading`);
    expect(value).toBe(MOCK_VALUE);
    expect(savedValue).toBe('');
    expect(error).toBe(MOCK_ERROR);
    expect(placeholder).toBe(SITE_MESSAGES_BY_LOCALE.DE.notFound.heading);
  });

  it('writes a field change under that field', () => {
    const { result } = renderHook(() => useVoiceFieldState('notFoundEyebrow'), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.onChange(MOCK_CHANGE);
    });

    expect(setFieldValue).toHaveBeenCalledWith('notFoundEyebrow', MOCK_CHANGE);
  });
});
