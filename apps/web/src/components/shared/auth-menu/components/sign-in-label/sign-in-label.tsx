import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { authMenuVariants } from '@web/components/shared/auth-menu/auth-menu-variants';
import { useTranslations } from 'next-intl';

export const SignInLabel = () => {
  const t = useTranslations('authMenu');
  const { signInGlyph, signInText } = authMenuVariants();

  return (
    <>
      <Icon name={ICONS.USER} size={SIZE.MD} className={signInGlyph()} />
      <span className={signInText()}>{t('signIn')}</span>
    </>
  );
};
