import { renderHook } from '@testing-library/react';

import { useFormFieldControl } from './form-field-control-provider';

describe(useFormFieldControl, () => {
  it('throws when read outside a provider', () => {
    expect(() => renderHook(() => useFormFieldControl())).toThrow(
      'useFormFieldControl must be used within a FormField or FormFieldControlProvider',
    );
  });
});
