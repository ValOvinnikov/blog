import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import type { TComparedCommit } from '@platform/server/github/compare-commits';
import { formatDate } from '@platform/utils/format-date/format-date';
import { shortSha } from '@platform/utils/short-sha/short-sha';
import { tv } from '@platform/utils/tv/tv';
import { useLocale, useTranslations } from 'next-intl';

const releaseCommitsVariants = tv({
  slots: {
    root: ['flex flex-col gap-4'],
    sha: ['font-mono text-admin-12-5'],
  },
});

export type TReleaseCommitsProps = {
  commits: TComparedCommit[];
  totalCommits: number;
  lastTag: string;
};

const firstLine = (message: string) => message.split('\n')[0];

export const ReleaseCommits = ({
  commits,
  totalCommits,
  lastTag,
}: TReleaseCommitsProps) => {
  const t = useTranslations('releaseCommits');
  const locale = useLocale();
  const { root, sha } = releaseCommitsVariants();

  return (
    <div className={root()}>
      {commits.length < totalCommits && (
        <Alert
          type={ALERT_TYPE.INFO}
          description={t('newestOnly', {
            shown: commits.length,
            total: totalCommits,
          })}
        />
      )}
      <DataTableShell
        items={commits}
        ariaLabel={t('ariaLabel', { tag: lastTag })}
        emptyMessage={t('empty', { tag: lastTag })}
        columns={[
          { key: 'sha', label: t('columnCommit') },
          { key: 'message', label: t('columnMessage') },
          { key: 'author', label: t('columnAuthor') },
          { key: 'date', label: t('columnDate') },
        ]}
        renderRow={({ sha: commitSha, message, authorName, authoredAt }) => (
          <DataTableShell.Row key={commitSha}>
            <DataTableShell.Cell>
              <span className={sha()}>{shortSha(commitSha)}</span>
            </DataTableShell.Cell>
            <DataTableShell.Cell>{firstLine(message)}</DataTableShell.Cell>
            <DataTableShell.Cell>{authorName}</DataTableShell.Cell>
            <DataTableShell.Cell>
              {authoredAt && (
                <time dateTime={authoredAt}>
                  {formatDate(new Date(authoredAt), locale)}
                </time>
              )}
            </DataTableShell.Cell>
          </DataTableShell.Row>
        )}
      />
    </div>
  );
};
