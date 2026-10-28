import { RuleTester } from 'eslint';

import { noNestedQueryRule } from './no-nested-query.js';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
});

const NESTED = { messageId: 'noNestedQuery' };

ruleTester.run('no-nested-query', noNestedQueryRule, {
  valid: [
    {
      code: "const btn = screen.getByRole('button'); await user.click(btn); expect(btn).toBeVisible();",
    },
    { code: "expect(screen.getByRole('button').textContent).toBe('a');" },
    { code: "expect({ el: screen.getByRole('button') }).toBeDefined();" },
    { code: "foo(screen.getByRole('button'));" },
    { code: "await user.click(buttons.getByRole('button'));" },
    { code: "fireEvent(el, new Event('x'));" },
  ],
  invalid: [
    {
      code: "expect(screen.getByRole('button')).toBeVisible();",
      errors: [NESTED],
    },
    {
      code: "expect(screen.queryByText('x')).not.toBeInTheDocument();",
      errors: [NESTED],
    },
    {
      code: "await user.click(within(row).getByText('x'));",
      errors: [NESTED],
    },
    {
      code: "await userEvent.type(screen.getByLabelText('a'), 'b');",
      errors: [NESTED],
    },
    {
      code: "fireEvent.click(screen.getAllByRole('button'));",
      errors: [NESTED],
    },
    {
      code: "fireEvent(screen.getByRole('button'), new Event('x'));",
      errors: [NESTED],
    },
    {
      code: "expect(await screen.findByText('x')).toBeVisible();",
      errors: [NESTED],
    },
  ],
});
