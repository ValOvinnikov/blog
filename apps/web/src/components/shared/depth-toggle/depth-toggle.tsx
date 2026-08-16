'use client';

import { DEPTH, type TDepth } from '@blog/config';
import { SegmentedControl, type ISegmentedControlOption } from '@blog/ui/atoms';
import { useDepth } from '@web/context/depth-provider';

export interface IDepthToggleLabels {
  skim: string;
  read: string;
  deep: string;
  ariaLabel: string;
}

export interface IDepthToggleProps {
  /** Whether the post has an approved skim — omits the `30s` option when `false`. */
  hasSkim: boolean;
  /** Whether the post has any authored asides — omits the `Deep` option when `false`. */
  hasDeep: boolean;
  /** Copy for each option and the control's `aria-label` — supplied by the caller (next-intl at the page level). */
  labels: IDepthToggleLabels;
  className?: string;
}

/**
 * DepthToggle — client leaf composing `@blog/ui`'s `SegmentedControl` with
 * `useDepth()`. Renders nothing when the post has neither a skim nor asides
 * (today's default post shape) — the reader sees no control at all rather
 * than a toggle with only one meaningful option.
 *
 * @example
 * <DepthToggle
 *   hasSkim={Boolean(post.skim)}
 *   hasDeep={post.hasAsides}
 *   labels={{ skim: '30s', read: 'Read', deep: 'Deep', ariaLabel: 'Reading depth' }}
 * />
 */
export const DepthToggle = ({
  hasSkim,
  hasDeep,
  labels,
  className,
}: IDepthToggleProps) => {
  const { depth, setDepth } = useDepth();

  if (!hasSkim && !hasDeep) return null;

  const options: ISegmentedControlOption<TDepth>[] = [
    ...(hasSkim ? [{ value: DEPTH.SKIM, label: labels.skim }] : []),
    { value: DEPTH.READ, label: labels.read },
    ...(hasDeep ? [{ value: DEPTH.DEEP, label: labels.deep }] : []),
  ];

  return (
    <SegmentedControl
      options={options}
      value={depth}
      onChange={setDepth}
      ariaLabel={labels.ariaLabel}
      className={className}
    />
  );
};
