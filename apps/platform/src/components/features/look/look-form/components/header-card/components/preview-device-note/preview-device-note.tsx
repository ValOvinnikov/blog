import { ICONS } from '@blog/config';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { Button } from '@platform/components/shared/button';
import { Icon } from '@platform/components/shared/icon';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { ICON_SIZE } from '@platform/constants/icon';
import { PREVIEW_DEVICE } from '@platform/constants/preview';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const previewDeviceNoteVariants = tv({
  slots: {
    root: ['flex flex-wrap items-center gap-2 text-admin-12-5 text-admin-text'],
    action: [
      'gap-1.5 text-admin-12-5 text-admin-brand-strong underline underline-offset-2',
    ],
  },
});

export const PreviewDeviceNote = () => {
  const { previewDevice, setPreviewDevice } = useLookForm();
  const t = useTranslations('lookForm');
  const { root, action } = previewDeviceNoteVariants();

  if (previewDevice === PREVIEW_DEVICE.DESKTOP) {
    return null;
  }

  return (
    <div className={root()}>
      <p>{t(`headerPreviewDeviceNote.${previewDevice}`)}</p>
      <Button
        variant={BUTTON_VARIANT.LINK}
        className={action()}
        onClick={() => setPreviewDevice(PREVIEW_DEVICE.DESKTOP)}
      >
        <Icon name={ICONS.MONITOR} size={ICON_SIZE.XS} strokeWidth={2} />
        {t('headerShowOnDesktop')}
      </Button>
    </div>
  );
};
