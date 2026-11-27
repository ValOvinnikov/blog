import type { TRequestContext } from '@web/server/request-context/request-context';
import type { TNotFoundContext } from '@web/server/request-context/to-not-found-context/to-not-found-context';
import {
  MOCK_NOT_FOUND_CONTEXT,
  MOCK_REQUEST_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';

/**
 * Storybook-only stand-in for the real module, which throws when
 * `getRequestContext()` is read before `enterRequestContext()` has run for a
 * request — something that never happens outside the real Next.js request
 * lifecycle (`.storybook/main.ts`).
 */
export const enterRequestContext = async (): Promise<void> => {};

export const getRequestContext = async (): Promise<TRequestContext> =>
  MOCK_REQUEST_CONTEXT;

export const getNotFoundContext = async (): Promise<TNotFoundContext> =>
  MOCK_NOT_FOUND_CONTEXT;
