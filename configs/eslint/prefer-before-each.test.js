import { RuleTester } from 'eslint';

import { preferBeforeEachRule } from './prefer-before-each.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const OPENING = { messageId: 'repeatedOpening' };
const SETUP = { messageId: 'setupInCase' };
const RENDER = { messageId: 'repeatedRender' };

ruleTester.run('prefer-before-each', preferBeforeEachRule, {
  valid: [
    {
      code: "describe('x', () => { beforeEach(() => { setup(); }); it('a', () => { expect(1).toBe(1); }); it('b', () => { expect(2).toBe(2); }); });",
    },
    {
      code: "describe('x', () => { it('a', () => { setup({ a: 1 }); }); it('b', () => { setup({ a: 2 }); }); });",
    },
    {
      code: "describe('x', () => { it('a', () => { setup(); }); }); describe('y', () => { it('b', () => { setup(); }); });",
    },
    {
      code: "describe('x', () => { let user; beforeEach(() => { user = userEvent.setup(); }); });",
    },
    {
      code: 'render(<A b />); render(<A b />); render(<A c />);',
    },
    {
      code: "it('a', () => expect(setup()).toBe(1)); it('b', () => expect(setup()).toBe(1));",
    },
    { code: "it.each([1, 2])('a', (n) => { setup(); });" },
  ],
  invalid: [
    {
      code: "describe('x', () => { it('a', () => { setup(); expect(1).toBe(1); }); it('b', () => { setup(); expect(2).toBe(2); }); });",
      errors: [OPENING, OPENING],
    },
    {
      code: "it('a', () => { vi.useFakeTimers(); }); test.only('b', () => { vi.useFakeTimers(); });",
      errors: [OPENING, OPENING],
    },
    {
      code: "describe('x', () => { it('a', async () => { await user.click(button); }); it('b', async () => { await user.click(button); }); });",
      errors: [OPENING, OPENING],
    },
    {
      code: "it('a', async () => { const user = userEvent.setup(); await user.click(b); });",
      errors: [SETUP],
    },
    {
      code: "describe('x', () => { beforeEach(() => { render(<A b />); }); }); describe('y', () => { beforeEach(() => { render(<A b />); }); }); render(<A   b />);",
      errors: [RENDER, RENDER, RENDER],
    },
  ],
});
