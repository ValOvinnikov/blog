import messages from '@platform/i18n/messages/en.json';
import { ARIA_PRESSED } from '@platform/testing/aria';
import { screen } from '@platform/testing/custom-render';
import { renderPreview } from '@platform/testing/look/look-preview-render';
import {
  MOCK_LOGO_DARK_URL,
  MOCK_LOGO_URL,
} from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import { COLOR_MODE } from '@shinefold/config';

import { LookPreview } from './look-preview';

const { previewModeControl: PREVIEW_MODE_CONTROL, lookPreview: LOOK_PREVIEW } =
  messages;

const LOGOS = {
  logo: { url: MOCK_LOGO_URL },
  logoDark: { url: MOCK_LOGO_DARK_URL },
};

const sampleThemeToggle = () =>
  screen.queryByRole('button', {
    name: new RegExp(
      `${LOOK_PREVIEW.themeToggleDark}|${LOOK_PREVIEW.themeToggleLight}`,
    ),
  });

describe(`<${LookPreview.name}/>`, () => {
  it.each([
    {
      colorMode: COLOR_MODE.DARK,
      shown: PREVIEW_MODE_CONTROL.modeDark,
      removed: PREVIEW_MODE_CONTROL.modeLight,
      logo: MOCK_LOGO_DARK_URL,
    },
    {
      colorMode: COLOR_MODE.LIGHT,
      shown: PREVIEW_MODE_CONTROL.modeLight,
      removed: PREVIEW_MODE_CONTROL.modeDark,
      logo: MOCK_LOGO_URL,
    },
  ])(
    'shows a $colorMode site only in its locked mode, with no sample theme toggle',
    ({ colorMode, shown, removed, logo }) => {
      renderPreview({ values: { colorMode, ...LOGOS } });

      const shownButton = screen.getByRole('button', { name: shown });
      const removedButton = screen.queryByRole('button', { name: removed });
      const sampleLogos = screen.getAllByRole('img', {
        name: MOCK_TENANT_NAME,
      });

      expect(shownButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(removedButton).not.toBeInTheDocument();
      expect(sampleThemeToggle()).not.toBeInTheDocument();
      sampleLogos.forEach((sampleLogo) => {
        expect(sampleLogo).toHaveAttribute('src', logo);
      });
    },
  );

  it('offers both views and the sample theme toggle when the reader chooses', () => {
    renderPreview({ values: { colorMode: COLOR_MODE.READER } });

    const lightButton = screen.getByRole('button', {
      name: PREVIEW_MODE_CONTROL.modeLight,
    });
    const darkButton = screen.getByRole('button', {
      name: PREVIEW_MODE_CONTROL.modeDark,
    });

    expect(lightButton).toBeInTheDocument();
    expect(darkButton).toBeInTheDocument();
    expect(sampleThemeToggle()).toBeInTheDocument();
  });
});
