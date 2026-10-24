import { SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_SITE_PREVIEW_THEME } from '@platform/testing/site-preview-theme';
import {
  buildVoiceDraft,
  localeDraftOf,
  withVoiceValue,
} from '@platform/utils/voice-draft/voice-draft';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import {
  useVoiceEditor,
  useVoiceFieldState,
  VoiceEditorProvider,
} from './voice-editor-provider';

const { DE } = LOCALE_ISO_CODES;

const setFieldValue = vi.fn();

const savedValues = localeDraftOf(buildVoiceDraft({}, [DE]), DE);
const values = localeDraftOf(
  withVoiceValue(buildVoiceDraft({}, [DE]), DE, 'notFoundHeading', 'Weg'),
  DE,
);

const Wrapper = ({ children }: { children: ReactNode }) => (
  <VoiceEditorProvider
    locale={DE}
    fieldIdPrefix="voice"
    values={values}
    savedValues={savedValues}
    errors={{ notFoundHeading: 'Zu lang.' }}
    openListFieldId={undefined}
    setOpenListFieldId={vi.fn()}
    setFieldValue={setFieldValue}
    specimenTheme={MOCK_SITE_PREVIEW_THEME}
  >
    {children}
  </VoiceEditorProvider>
);

describe(VoiceEditorProvider, () => {
  it('throws when read outside a provider', () => {
    expect(() => renderHook(() => useVoiceEditor())).toThrow(
      'useVoiceEditor must be used within a VoiceEditorProvider',
    );
  });

  it("gives a field its own value, saved value, error and the language's default", () => {
    const { result } = renderHook(() => useVoiceFieldState('notFoundHeading'), {
      wrapper: Wrapper,
    });

    expect(result.current).toMatchObject({
      inputId: 'voice-notFoundHeading',
      value: 'Weg',
      savedValue: '',
      error: 'Zu lang.',
      placeholder: SITE_MESSAGES_BY_LOCALE.DE.notFound.heading,
    });
  });

  it('writes a field change under that field', () => {
    const { result } = renderHook(() => useVoiceFieldState('notFoundEyebrow'), {
      wrapper: Wrapper,
    });

    result.current.onChange('Hoppla');

    expect(setFieldValue).toHaveBeenCalledWith('notFoundEyebrow', 'Hoppla');
  });
});
