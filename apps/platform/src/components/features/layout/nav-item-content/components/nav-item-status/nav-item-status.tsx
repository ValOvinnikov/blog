import {
  navItemContentVariants,
  type TNavItemStatusTone,
} from '@platform/components/features/layout/nav-item-content/nav-item-content-variants';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import { useTranslations } from 'next-intl';

export type TNavItemStatus = {
  text: string;
  icon: TRegisteredIconName;
  tone: TNavItemStatusTone;
};

export type TNavItemStatusProps = {
  status: TNavItemStatus;
};

export const NavItemStatus = ({ status }: TNavItemStatusProps) => {
  const { text, icon, tone } = status;
  const t = useTranslations('navItemContent');
  const { statusSeparator, statusLine, statusIcon, statusText } =
    navItemContentVariants({ tone });

  const separator = (
    <span className={statusSeparator()}>{t('statusSeparator')}</span>
  );
  const line = (
    <span className={statusLine()}>
      <Icon
        name={icon}
        size={ICON_SIZE.XXS}
        strokeWidth={ICON_STROKE_WIDTH.STATUS_LINE}
        className={statusIcon()}
      />
      <span className={statusText()}>{text}</span>
    </span>
  );

  return (
    <>
      {separator} {line}
    </>
  );
};
