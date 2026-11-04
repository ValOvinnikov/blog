import { useTranslations } from 'next-intl';

import { saveBarLocationVariants } from './save-bar-location-variants';

export type TUnsavedCard = {
  name: string;
  onSelect: () => void;
};

type TSaveBarLocationProps = {
  cards: readonly [TUnsavedCard, ...TUnsavedCard[]];
};

export const SaveBarLocation = ({ cards }: TSaveBarLocationProps) => {
  const t = useTranslations('saveBar');
  const { root, link } = saveBarLocationVariants();
  const [firstCard] = cards;

  if (cards.length > 1) {
    return (
      <span className={root()}>{t('inCards', { cards: cards.length })}</span>
    );
  }

  return (
    <span className={root()}>
      {t.rich('inCard', {
        card: firstCard.name,
        link: (chunks) => (
          <button type="button" onClick={firstCard.onSelect} className={link()}>
            {chunks}
          </button>
        ),
      })}
    </span>
  );
};
