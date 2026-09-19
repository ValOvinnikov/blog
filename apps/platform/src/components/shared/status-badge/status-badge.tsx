import {
  statusBadgeVariants,
  type TStatusBadgeVariants,
} from './status-badge-variants';

export type TStatusBadgeProps = {
  tone?: TStatusBadgeVariants['tone'];
  hasDot?: boolean;
  children: React.ReactNode;
  className?: string;
};

export const StatusBadge = ({
  tone,
  hasDot = true,
  children,
  className,
}: TStatusBadgeProps) => {
  const { root, dot } = statusBadgeVariants({ tone });

  return (
    <span className={root({ class: className })}>
      {hasDot && <span className={dot()} aria-hidden="true" />}
      {children}
    </span>
  );
};
