import { redirect } from 'next/navigation';

import OperatorIndexPage from './page';

describe(OperatorIndexPage, () => {
  it('redirects to the tenant list', () => {
    expect(() => OperatorIndexPage()).toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/tenants');
  });
});
