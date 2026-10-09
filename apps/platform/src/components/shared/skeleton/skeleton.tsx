import { skeletonVariants } from './skeleton-variants';

export type TSkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className }: TSkeletonProps) => (
  <span
    data-testid="skeleton"
    aria-hidden="true"
    className={skeletonVariants({ class: className })}
  />
);
