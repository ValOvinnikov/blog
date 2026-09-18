import type { RenderResult } from '@testing-library/react';

/** The `setup(overrides?)` shape `customRenderAsync` returns, shared by every async-component test contract. */
export type TAsyncSetup = (
  overrides?: Record<string, unknown>,
) => Promise<RenderResult>;
