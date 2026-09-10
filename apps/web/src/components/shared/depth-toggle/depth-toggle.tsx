'use client';

import { DEPTH, type TDepth } from '@blog/config';
import {
  SegmentedControl,
  type ISegmentedControlOption,
} from '@blog/ui/atoms/segmented-control';
import { useDepth } from '@web/context/depth-provider';
import { useTranslations } from 'next-intl';

export interface IDepthToggleProps {
  /** Whether the post has an approved skim — omits the `30s` option when `false`. */
  hasSkim: boolean;
  /** Whether the post has any authored asides — omits the `Deep` option when `false`. */
  hasDeep: boolean;
  className?: string;
}

/**
 * DepthToggle — client leaf composing `@blog/ui`'s `SegmentedControl` with
 * `useDepth()`. Renders nothing when the post has neither a skim nor asides
 * (today's default post shape) — the reader sees no control at all rather
 * than a toggle with only one meaningful option.
 *
 * @example
 * <DepthToggle hasSkim={Boolean(post.skim)} hasDeep={post.hasAsides} />
 */
export const DepthToggle = ({
  hasSkim,
  hasDeep,
  className,
}: IDepthToggleProps) => {
  const { depth, setDepth } = useDepth();
  const t = useTranslations('blogPostPage');

  if (!hasSkim && !hasDeep) return null;

  const options: ISegmentedControlOption<TDepth>[] = [
    ...(hasSkim ? [{ value: DEPTH.SKIM, label: t('depthToggle.skim') }] : []),
    { value: DEPTH.READ, label: t('depthToggle.read') },
    ...(hasDeep ? [{ value: DEPTH.DEEP, label: t('depthToggle.deep') }] : []),
  ];

  return (
    <SegmentedControl
      options={options}
      value={depth}
      onChange={setDepth}
      ariaLabel={t('depthToggle.ariaLabel')}
      className={className}
    />
  );
};
