import { ICONS } from '@blog/config';
import { Heading, Icon, Text } from '@blog/ui/atoms';
import { TerminalChip } from '@blog/ui/molecules';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

import {
  notFoundLinkVariants,
  notFoundPageVariants,
} from './not-found-page-variants';

export interface INotFoundPageProps {
  /** Renders the plain 404 body with no `TerminalChip`/prompt-line styling. */
  plain?: boolean;
}

const s = notFoundPageVariants();
const {
  root,
  prompt: promptSlot,
  command: commandSlot,
  arrow,
} = notFoundLinkVariants();

/**
 * NotFoundPage — the terminal-styled 404 body content. Rendered from the
 * root `not-found.tsx`, which sits outside the `[locale]` route tree (this
 * app's `Header`/`Footer` chrome lives in `[locale]/layout.tsx`), so this
 * stays a self-contained, centered composition: no site chrome, just the
 * `TerminalChip` molecule, a short explanation, and a link home.
 */
export const NotFoundPage = ({ plain = false }: INotFoundPageProps) => {
  const t = useTranslations('notFound');

  return (
    <main className={s.root()}>
      <Heading level={1} visual="hero">
        404
      </Heading>
      {plain ? (
        <Text className={s.plainCopy()}>{t('commandNotFound')}</Text>
      ) : (
        <TerminalChip
          prefix="404: "
          suffix={t('commandNotFound')}
          className={s.chip()}
        />
      )}
      <Text className={s.copy()}>{t('description')}</Text>
      {plain ? (
        <SmartLink
          href="/"
          aria-label={t('returnHome')}
          className={s.plainLink()}
        >
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
