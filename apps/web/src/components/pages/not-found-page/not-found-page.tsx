import { ICONS, type TVoicePortableText } from '@shinefold/config';
import { Eyebrow } from '@shinefold/ui/components/atoms/eyebrow';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { Text } from '@shinefold/ui/components/atoms/text';
import { SmartLink } from '@web/components/shared/smart-link';
import { VoiceRichText } from '@web/components/shared/voice-rich-text';
import { useTranslations } from 'next-intl';

import { notFoundPageVariants } from './not-found-page-variants';

const s = notFoundPageVariants();

export interface INotFoundPageProps {
  supportingText: TVoicePortableText;
}

export const NotFoundPage = ({ supportingText }: INotFoundPageProps) => {
  const t = useTranslations('notFound');
  const eyebrow = t('eyebrow');

  return (
    <main className={s.root()}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading level={1} visual="hero">
        {t('heading')}
      </Heading>
      <Text className={s.copy()}>
        <VoiceRichText value={supportingText} />
      </Text>
      <SmartLink href="/" className={s.link()}>
        {t('returnHome')}
        <Icon
          name={ICONS.ARROW}
          className={s.arrow()}
          dataTestId="not-found-arrow-icon"
        />
      </SmartLink>
    </main>
  );
};
