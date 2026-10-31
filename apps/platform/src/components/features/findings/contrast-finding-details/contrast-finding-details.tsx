import { SIZE } from '@blog/config';
import type { TContrastResultBody } from '@blog/config/types';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { LinkButton } from '@platform/components/shared/link-button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

import { contrastFindingDetailsVariants } from './contrast-finding-details-variants';

const SHORT_SHA_LENGTH = 7;

export type TContrastFindingDetailsProps = {
  result: TContrastResultBody;
};

export const ContrastFindingDetails = ({
  result,
}: TContrastFindingDetailsProps) => {
  const { sha, tag, failureCount, runUrl } = result;
  const t = useTranslations('contrastFindingDetails');
  const { root, facts, code, secondary, actions } =
    contrastFindingDetailsVariants();
  const shortSha = sha.slice(0, SHORT_SHA_LENGTH);

  return (
    <div className={root()}>
      <span className={facts()}>
        <span>
          {t.rich('commit', {
            sha: shortSha,
            code: (chunks) => (
              <code className={code()} title={sha}>
                {chunks}
              </code>
            ),
          })}
        </span>
        {tag && <span>{t('tag', { tag })}</span>}
      </span>
      <span className={secondary()}>
        {t('failures', { count: failureCount })}
      </span>
      <span className={actions()}>
        <ExternalLinkButton
          href={runUrl}
          variant={BUTTON_VARIANT.SECONDARY}
          size={SIZE.SM}
          ariaLabel={t('viewRunLabel', { sha: shortSha })}
        >
          {t('viewRun')}
        </ExternalLinkButton>
        <LinkButton
          href={adminRoutes.releases()}
          variant={BUTTON_VARIANT.SECONDARY}
          size={SIZE.SM}
        >
          {t('openReleases')}
        </LinkButton>
      </span>
    </div>
  );
};
