import { TEXT_ROLE } from '@shinefold/config';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Text } from '@shinefold/ui/components/atoms/text';
import type { THeroStyles } from '@shinefold/ui/components/organisms/hero/hero-styles';

type THeroHeadlineProps = {
  title: string;
  titleId: string;
  excerpt?: string;
  heroStyles: THeroStyles;
};

export const HeroHeadline = ({
  title,
  titleId,
  excerpt,
  heroStyles: { styles, banner },
}: THeroHeadlineProps) => (
  <>
    <div className={styles.title()}>
      <Heading
        id={titleId}
        level={1}
        visual={TEXT_ROLE.HERO_TITLE}
        className={styles.heading({ class: banner?.title() })}
      >
        {title}
      </Heading>
    </div>
    {excerpt && (
      <Text
        textRole={TEXT_ROLE.INTRO}
        className={styles.excerpt({ class: banner?.text() })}
      >
        {excerpt}
      </Text>
    )}
  </>
);
