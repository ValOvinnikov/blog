import { avatarImageVariants, avatarVariants } from './avatar-variants';

export type TAvatarProps = {
  src?: string;
  alt: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function Avatar({ src, alt, name, size, className }: TAvatarProps) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  return (
    <span className={avatarVariants({ size, class: className })}>
      {src ? (
        <img src={src} alt={alt} className={avatarImageVariants()} />
      ) : (
        <>
          <span aria-hidden="true">{initials}</span>
          <span className="sr-only">{name}</span>
        </>
      )}
    </span>
  );
}
