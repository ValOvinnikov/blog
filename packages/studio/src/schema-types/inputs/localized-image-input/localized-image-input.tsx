import { removesImageLeavingEmptyAlt } from '@blog/studio/schema-types/inputs/localized-image-input/removes-image-leaving-empty-alt';
import {
  type FormPatch,
  type ObjectInputProps,
  PatchEvent,
  unset,
} from 'sanity';

export const LocalizedImageInput = (props: ObjectInputProps) => {
  const { value, onChange } = props;

  const handleChange = (patch: FormPatch | FormPatch[] | PatchEvent) => {
    const { patches } = PatchEvent.from(patch);

    onChange(removesImageLeavingEmptyAlt(value, patches) ? unset() : patch);
  };

  return props.renderDefault({ ...props, onChange: handleChange });
};
