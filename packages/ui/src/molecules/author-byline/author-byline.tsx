import { type IWithDataTestId, Size } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Heading } from '@blog/ui/atoms/heading';
import { Text } from '@blog/ui/atoms/text';

import { authorBylineVariants } from './author-byline-variants';

export interface IAuthorBylineProps extends IWithDataTestId {
  name: string;
  bio?: string;
  avatarUrl?: string;
  className?: string;
}

const s = authorBylineVariants();

/**
 * AuthorByline — expanded author card shown below a post body: avatar, the
 * author's name as a heading, and an optional bio snippet.
 */
export const AuthorByline = ({
  name,
  bio,
  avatarUrl,
  className,
  dataTestId,
}: IAuthorBylineProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    <Avatar name={name} alt={name} src={avatarUrl} size={Size.LG} />
    <div className={s.body()}>
      <Heading level={3}>{name}</Heading>
      {bio && (
        <Text variant="muted" className={s.bio()}>
          {bio}
        </Text>
      )}
    </div>
  </div>
);
