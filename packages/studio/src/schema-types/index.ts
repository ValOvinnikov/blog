import { documents } from './documents';
import { modules } from './modules';
import { objects } from './objects';
import { portableText } from './portable-text';

export const schemaTypes = [
  ...documents,
  ...objects,
  ...portableText,
  ...modules,
];
