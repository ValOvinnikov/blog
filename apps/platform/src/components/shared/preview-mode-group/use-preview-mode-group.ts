import { ICONS } from '@blog/config';
import type { TIconToggleGroupProps } from '@platform/components/shared/icon-toggle-group';
import { PREVIEW_MODE, type TPreviewMode } from '@platform/constants/preview';
import { useTranslations } from 'next-intl';

export const usePreviewModeGroup = (
  value: TPreviewMode,
  onChange: (mode: TPreviewMode) => void,
): TIconToggleGroupProps<TPreviewMode> => {
  const t = useTranslations('previewModeControl');

  return {
    ariaLabel: t('previewColorSchemeAriaLabel'),
    value,
    onChange,
    options: [
      {
        value: PREVIEW_MODE.LIGHT,
        icon: ICONS.SUN,
        ariaLabel: t('modeLight'),
        tooltip: t('modeLight'),
      },
      {
        value: PREVIEW_MODE.DARK,
        icon: ICONS.MOON,
        ariaLabel: t('modeDark'),
        tooltip: t('modeDark'),
      },
    ],
  };
};
