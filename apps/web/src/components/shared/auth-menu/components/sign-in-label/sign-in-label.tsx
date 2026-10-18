import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { authMenuVariants } from '@web/components/shared/auth-menu/auth-menu-variants';
import { useTranslations } from 'next-intl';

export const SignInLabel = () => {
  const t = useTranslations('authMenu');
  const { signInGlyph } = authMenuVariants();

  return (
    <>
      <Icon name={ICONS.USER} size={SIZE.SM} className={signInGlyph()} />
      {t('signIn')}
    </>
  );
};
