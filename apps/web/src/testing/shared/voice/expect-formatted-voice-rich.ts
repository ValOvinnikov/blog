import { screen } from '@web/testing/custom-render';
import {
  MOCK_VOICE_BOLD_TEXT,
  MOCK_VOICE_ITALIC_TEXT,
  MOCK_VOICE_LINK_HREF,
  MOCK_VOICE_LINK_TEXT,
} from '@web/testing/shared/voice/fixtures';

export const expectFormattedVoiceRich = () => {
  const link = screen.getByRole('link', { name: MOCK_VOICE_LINK_TEXT });
  const bold = screen.getByText(MOCK_VOICE_BOLD_TEXT, { selector: 'strong' });
  const italic = screen.getByText(MOCK_VOICE_ITALIC_TEXT, { selector: 'em' });

  expect(link).toHaveAttribute('href', MOCK_VOICE_LINK_HREF);
  expect(bold).toBeVisible();
  expect(italic).toBeVisible();
};
