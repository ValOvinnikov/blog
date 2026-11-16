import { isString } from '@shinefold/utils/primitives';

export const stripeIdOf = (value: string | { id: string }): string =>
  isString(value) ? value : value.id;
