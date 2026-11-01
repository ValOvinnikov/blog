import { SIZE } from '@blog/config';
import { BrandMark } from '@platform/components/shared/brand-mark';
import { Card } from '@platform/components/shared/card';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { centeredCardFrameVariants } from './centered-card-frame-variants';

export type TCenteredCardFrameProps = {
  children: ReactNode;
  footer?: ReactNode;
};

export const CenteredCardFrame = ({
  children,
  footer,
}: TCenteredCardFrameProps) => {
  const t = useTranslations('centeredCardFrame');
  const { root, main, brand, brandName, card, body } =
    centeredCardFrameVariants();

  return (
    <div className={root()}>
      <main className={main()}>
        <div className={brand()}>
          <BrandMark size={SIZE.XL} />
          <span className={brandName()}>{t('brandName')}</span>
        </div>
        <Card className={card()}>
          <Card.Body className={body()}>{children}</Card.Body>
        </Card>
        {footer}
      </main>
    </div>
  );
};
