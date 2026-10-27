import { renderHook } from '@platform/testing/custom-render';

import { useFormFieldControl } from './form-field-control-provider';

describe(useFormFieldControl, () => {
  it('throws when read outside a provider', () => {
    const renderOutsideProvider = () => renderHook(() => useFormFieldControl());

    expect(renderOutsideProvider).toThrow(
      'useFormFieldControl must be used within a FormField or FormFieldControlProvider',
    );
  });
});
