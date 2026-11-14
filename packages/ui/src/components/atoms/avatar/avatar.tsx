import type { IWithDataTestId } from '@blog/config';
import { hasArrayGotMultipleItems } from '@blog/utils/primitives';

import {
  avatarImageVariants,
  avatarNameVariants,
  avatarVariants,
  type TAvatarVariants,
} from './avatar-variants';

export type TAvatarProps = {
  src?: string;
  alt: string;
  name: string;
  size?: TAvatarVariants['size'];
  shape?: TAvatarVariants['shape'];
  className?: string;
  onImageError?: () => void;
} & IWithDataTestId;

const joinFirstTwoInitials = (parts: readonly string[]): string =>
  parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (hasArrayGotMultipleItems(words)) return joinFirstTwoInitials(words);

  const token = words[0] ?? '';
  const localPart = token.split('@')[0] ?? token;
  const segments = localPart.split(/[._-]+/).filter(Boolean);

  if (hasArrayGotMultipleItems(segments)) return joinFirstTwoInitials(segments);

  return localPart.slice(0, 2).toUpperCase();
};

/** Renders a provided image, or an initials badge derived from `name` when no image is supplied. */
export const Avatar = ({
  src,
  alt,
  name,
  size,
  shape,
  className,
  onImageError,
  dataTestId,
}: TAvatarProps) => {
  const initials = getInitials(name);

  return (
    <span
      className={avatarVariants({ size, shape, class: className })}
      data-testid={dataTestId}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={avatarImageVariants()}
          onError={onImageError}
        />
      ) : (
        <>
          <span aria-hidden="true">{initials}</span>
          {alt && <span className={avatarNameVariants()}>{alt}</span>}
        </>
      )}
    </span>
  );
};
