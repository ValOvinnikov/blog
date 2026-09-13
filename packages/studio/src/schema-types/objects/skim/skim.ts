import { defineField, defineType } from 'sanity';

export const skimSchema = defineType({
  name: 'skim',
  title: 'Skim',
  type: 'object',
  description:
    'Short takeaways a reader can scan in 30 seconds before committing to the full post. Auto-generated — not meant to be written by hand.',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'takeaways',
      title: 'Takeaways',
      type: 'array',
      description:
        'The bullet points a reader scans before committing to the full post.',
      of: [{ type: 'string', validation: (rule) => rule.max(160) }],
      validation: (rule) => rule.min(3).max(7),
    }),
    defineField({
      name: 'generatedAt',
      title: 'Generated At',
      type: 'datetime',
      description: 'Set by the reading-depth pipeline.',
      readOnly: true,
    }),
    defineField({
      name: 'model',
      title: 'Model',
      type: 'string',
      description: 'Set by the reading-depth pipeline.',
      readOnly: true,
    }),
  ],
  preview: {
    select: { takeaways: 'takeaways' },
    prepare({ takeaways }: { takeaways?: string[] }) {
      return {
        title: 'Skim',
        subtitle: takeaways?.length
          ? `${takeaways.length} takeaway${takeaways.length === 1 ? '' : 's'}`
          : 'No takeaways yet',
      };
    },
  },
});
