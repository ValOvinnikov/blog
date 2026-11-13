import { SIZE } from '@blog/config';
import { BrandLogo } from '@platform/components/shared/brand-logo';
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
  const { root, main, card, body } = centeredCardFrameVariants();

  return (
    <div className={root()}>
      <main className={main()}>
        <BrandLogo ariaLabel={t('brandName')} size={SIZE.LG} />
        <Card className={card()}>
          <Card.Body className={body()}>{children}</Card.Body>
        </Card>
        {footer}
      </main>
    </div>
  );
};
