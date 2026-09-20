import { RuleTester } from 'eslint';

import { noClassAssertionsRule } from './no-class-assertions.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-class-assertions', noClassAssertionsRule, {
  valid: [
    {
      code: "expect(el).toHaveAttribute('aria-current', 'page');",
    },
    {
      code: 'function Foo() { return <Foo className="x" />; }',
    },
    {
      code: "screen.getByRole('button');",
    },
    {
      code: "el.getAttribute('data-state');",
    },
  ],
  invalid: [
    {
      code: "expect(el).toHaveClass('hover:bg-brand-primary-muted');",
      errors: [{ messageId: 'noClassAssertion' }],
    },
    {
      code: "expect(el).not.toHaveClass('x');",
      errors: [{ messageId: 'noClassAssertion' }],
    },
    {
      code: "expect(el.className).toBe('x');",
      errors: [{ messageId: 'noClassAssertion' }],
    },
    {
      code: "el.classList.contains('x');",
      errors: [{ messageId: 'noClassAssertion' }],
    },
    {
      code: "expect(el).toHaveAttribute('class', 'x');",
      errors: [{ messageId: 'noClassAssertion' }],
    },
    {
      code: "el.getAttribute('class');",
      errors: [{ messageId: 'noClassAssertion' }],
    },
  ],
});
