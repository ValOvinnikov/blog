import '@testing-library/jest-dom/vitest';

// Placeholder values for the validated env module (`@/utils/env/env`) so
// components/routes that read it can render under Vitest without requiring
// a real `.env` file. Tests never hit the network, so these values only need
// to satisfy the Zod schema shape.
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= 'test-project';
process.env.NEXT_PUBLIC_SANITY_DATASET ??= 'test-dataset';
