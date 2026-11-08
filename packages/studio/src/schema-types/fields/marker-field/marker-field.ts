import { defineField } from 'sanity';

// Sanity rejects an object type with no fields; an object that only marks something carries this hidden one.
export const markerField = () =>
  defineField({ name: 'marker', type: 'string', hidden: true });
