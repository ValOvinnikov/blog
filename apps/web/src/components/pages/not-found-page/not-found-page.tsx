import { ICONS } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import { Icon } from '@blog/ui/atoms/icon';
import { Text } from '@blog/ui/atoms/text';
import { TerminalChip } from '@blog/ui/molecules/terminal-chip';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

import {
  notFoundLinkVariants,
  notFoundPageVariants,
} from './not-found-page-variants';

export interface INotFoundPageProps {
  /** Renders the plain 404 body with no `TerminalChip`/prompt-line styling. */
  isPlain?: boolean;
}

const s = notFoundPageVariants();
const {
  root,
  prompt: promptSlot,
  command: commandSlot,
  arrow,
} = notFoundLinkVariants();

/**
 * NotFoundPage — the 404 body content. Rendered from the root
 * `not-found.tsx`, which sits outside the `[locale]` route tree (this app's
 * `Header`/`Footer` chrome lives in `[locale]/layout.tsx`), so this stays a
 * self-contained, centered composition: no site chrome, just a short
 * explanation and a link home. Renders the terminal-styled `TerminalChip`/
 * prompt-line treatment when `isPlain` is unset, or a plain equivalent when
 * `isPlain` is true (`chromeOn: false`).
 */
export const NotFoundPage = ({ isPlain = false }: INotFoundPageProps) => {
  const t = useTranslations('notFound');

  return (
    <main className={s.root()}>
      <Heading level={1} visual="hero">
        404
      </Heading>
      {isPlain ? (
        <Text variant="statement" className={s.plainCopy()}>
          {t('commandNotFound')}
        </Text>
      ) : (
        <TerminalChip
          prefix="404: "
          suffix={t('commandNotFound')}
          className={s.chip()}
        />
      )}
      <Text className={s.copy()}>{t('description')}</Text>
      {isPlain ? (
        <SmartLink href="/" className={s.plainLink()}>
          {t('returnHome')}
          <Icon
            name={ICONS.ARROW}
            className={s.plainArrow()}
            dataTestId="not-found-arrow-icon"
          />
        </SmartLink>
      ) : (
        <SmartLink href="/" aria-label={t('returnHome')} className={root()}>
          <span className={promptSlot()} aria-hidden="true">
            $
          </span>
          <span className={commandSlot()}>cd ~</span>
          <span className={arrow()} aria-hidden="true">
            <Icon name={ICONS.ARROW} dataTestId="not-found-arrow-icon" />
          </span>
        </SmartLink>
      )}
    </main>
  );
};
