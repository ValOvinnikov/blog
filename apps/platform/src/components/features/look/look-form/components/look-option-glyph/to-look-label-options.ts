import type { TSegmentedControlProps } from '@platform/components/shared/segmented-control';

export const toLookLabelOptions = <TValue extends string>(
  values: Record<string, TValue>,
  labelFor: (value: TValue) => string,
): TSegmentedControlProps<TValue>['options'] =>
  Object.values(values).map((value) => ({ value, label: labelFor(value) }));
