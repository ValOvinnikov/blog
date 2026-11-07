import type { TMaybeNull } from '@blog/config/types';
import { createContext } from 'react';
import type { SchemaType } from 'sanity';

/** The modules field's member types as a site with every module pack sees them, before the plan's own marks. */
export const ModulePickerTypesContext =
  createContext<TMaybeNull<readonly SchemaType[]>>(null);
