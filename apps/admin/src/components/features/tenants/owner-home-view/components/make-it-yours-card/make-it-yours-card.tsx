import { Card } from '@admin/components/shared/card';
import { adminRoutes } from '@admin/utils/routes/routes';
import { ICONS } from '@blog/config';
import { useTranslations } from 'next-intl';

import { Tile } from './components/tile/tile';
import { makeItYoursCardVariants } from './make-it-yours-card-variants';

/** The owner home's routes onward — Look, Voice and Features, the three settings surfaces an owner actually edits. */
export const MakeItYoursCard = () => {
  const t = useTranslations('ownerHomePage');
  const { grid } = makeItYoursCardVariants();

  return (
    <Card>
      <Card.Header
        title={t('makeItYoursCardTitle')}
        supportingText={t('makeItYoursSupportingText')}
        headingLevel={2}
      />
      <Card.Body>
        <div className={grid()}>
          <Tile
            href={adminRoutes.dashboardLook()}
            icon={ICONS.PALETTE}
            title={t('lookTileTitle')}
            description={t('lookTileDescription')}
          />
          <Tile
            href={adminRoutes.dashboardVoice()}
            icon={ICONS.QUOTE}
            title={t('voiceTileTitle')}
            description={t('voiceTileDescription')}
          />
          <Tile
            href={adminRoutes.dashboardFeatures()}
            icon={ICONS.SETTINGS}
            title={t('featuresTileTitle')}
            description={t('featuresTileDescription')}
          />
        </div>
      </Card.Body>
    </Card>
  );
};
