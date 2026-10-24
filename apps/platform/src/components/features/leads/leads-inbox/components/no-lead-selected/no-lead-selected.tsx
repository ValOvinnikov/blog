import { Card } from '@platform/components/shared/card';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';

export const NoLeadSelected = () => {
  const t = useTranslations('leadsInbox');

  return (
    <Card>
      <Card.Body>
        <Text variant="supporting">{t('noSelection')}</Text>
      </Card.Body>
    </Card>
  );
};
