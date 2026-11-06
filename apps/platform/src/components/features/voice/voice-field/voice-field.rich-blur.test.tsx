import type { TVoicePortableText } from '@blog/config';
import { screen } from '@platform/testing/custom-render';
import { customRenderInSettingsForm } from '@platform/testing/render-in-settings-form';
import { SUPPORTING_TEXT_FIELD } from '@platform/testing/voice/fixtures';
import {
  VoiceFieldInEditor,
  fieldById,
} from '@platform/testing/voice/voice-field-in-editor';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';

const EMPTY_EDITOR = 'Empty the editor';
const OTHER_CONTROL = 'Other control';

const { editorMounted } = vi.hoisted(() => ({ editorMounted: vi.fn() }));

vi.mock('@platform/components/shared/portable-text-editor', () => ({
  PortableTextEditor: ({
    field,
    onChange,
  }: {
    field: { label: string };
    onChange: (value: TVoicePortableText) => void;
  }) => {
    useEffect(() => {
      editorMounted();
    }, []);
    return (
      <>
        <input aria-label={field.label} />
        <button type="button" onClick={() => onChange([])}>
          {EMPTY_EDITOR}
        </button>
      </>
    );
  },
}));

const setup = customRenderInSettingsForm(
  () => (
    <>
      <VoiceFieldInEditor
        field={fieldById('notFoundSupportingText')}
        value={null}
        errors={{}}
        onSetFieldValue={vi.fn()}
      />
      <button type="button">{OTHER_CONTROL}</button>
    </>
  ),
  {},
);

describe('a rich <VoiceField/> leaving focus', () => {
  beforeEach(() => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  });

  it('keeps its editor when it was never emptied', async () => {
    const user = userEvent.setup();
    setup();

    const editor = screen.getByRole('textbox', { name: SUPPORTING_TEXT_FIELD });
    const otherControl = screen.getByRole('button', { name: OTHER_CONTROL });
    await user.click(editor);
    await user.click(otherControl);

    expect(editorMounted).toHaveBeenCalledOnce();
  });

  it('shows its default again when it was emptied and left', async () => {
    const user = userEvent.setup();
    setup();

    const emptyButton = screen.getByRole('button', { name: EMPTY_EDITOR });
    const otherControl = screen.getByRole('button', { name: OTHER_CONTROL });
    await user.click(emptyButton);
    await user.click(otherControl);

    expect(editorMounted).toHaveBeenCalledTimes(2);
  });

  it('keeps its editor when the window loses focus', async () => {
    const user = userEvent.setup();
    setup();
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);

    const emptyButton = screen.getByRole('button', { name: EMPTY_EDITOR });
    const otherControl = screen.getByRole('button', { name: OTHER_CONTROL });
    await user.click(emptyButton);
    await user.click(otherControl);

    expect(editorMounted).toHaveBeenCalledOnce();
  });
});
