import { titleField } from '@cms/schema-types/helpers/title-field';
import { MessageSquareText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const voiceSchema = defineType({
  name: 'settings_voice',
  title: 'Voice',
  type: 'document',
  icon: MessageSquareText,
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({
      title: title ?? 'Unknown',
      subtitle: 'Voice settings',
    }),
  },
  fieldsets: [
    {
      name: 'notFound',
      title: '404 page',
      description: 'Overrides for the not-found page copy.',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'terminalPrompts',
      title: 'Terminal prompts',
      description:
        'Overrides for the terminal-style prompt host and command text used across the auth menu, bookmarks page, and account page.',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'bookmarks',
      title: 'Bookmarks',
      description: 'Overrides for bookmark toast messages.',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'emptyStates',
      title: 'Empty states',
      description:
        'Overrides for empty-state messages across list and archive pages.',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    titleField(),
    defineField({
      name: 'notFoundMetaTitle',
      title: 'Not Found Meta Title',
      type: 'string',
      description:
        "Overrides the 404 page's meta title. Leave blank to use the preset's own 404 meta title.",
      fieldset: 'notFound',
    }),
    defineField({
      name: 'notFoundMetaDescription',
      title: 'Not Found Meta Description',
      type: 'string',
      description:
        "Overrides the 404 page's meta description. Leave blank to use the preset's own 404 meta description.",
      fieldset: 'notFound',
    }),
    defineField({
      name: 'notFoundCommandNotFound',
      title: 'Not Found Command Not Found',
      type: 'string',
      description:
        'Overrides the 404 page\'s "command not found" line. Leave blank to use the preset\'s own wording.',
      fieldset: 'notFound',
    }),
    defineField({
      name: 'notFoundDescription',
      title: 'Not Found Description',
      type: 'string',
      description:
        "Overrides the 404 page's description text. Leave blank to use the preset's own wording.",
      fieldset: 'notFound',
    }),
    defineField({
      name: 'notFoundReturnHome',
      title: 'Not Found Return Home',
      type: 'string',
      description:
        'Overrides the 404 page\'s "return home" link text. Leave blank to use the preset\'s own wording.',
      fieldset: 'notFound',
    }),
    defineField({
      name: 'terminalPromptHost',
      title: 'Terminal Prompt Host',
      type: 'string',
      description:
        "Overrides the terminal-style prompt host shown in the auth menu and across the account page (privacy, newsletter, identity sections). Leave blank to use the preset's own wording.",
      fieldset: 'terminalPrompts',
    }),
    defineField({
      name: 'authPromptCommandSignIn',
      title: 'Auth Prompt Command — Sign In',
      type: 'string',
      description:
        "Overrides the auth menu's sign-in prompt command. Leave blank to use the preset's own wording.",
      fieldset: 'terminalPrompts',
    }),
    defineField({
      name: 'authPromptCommandAccount',
      title: 'Auth Prompt Command — Account',
      type: 'string',
      description:
        "Overrides the auth menu's account prompt command. Leave blank to use the preset's own wording.",
      fieldset: 'terminalPrompts',
    }),
    defineField({
      name: 'bookmarksPromptCommand',
      title: 'Bookmarks Prompt Command',
      type: 'string',
      description:
        "Overrides the bookmarks page's prompt command. Leave blank to use the preset's own wording.",
      fieldset: 'terminalPrompts',
    }),
    defineField({
      name: 'accountPrivacyPromptCommand',
      title: 'Account Privacy Prompt Command',
      type: 'string',
      description:
        "Overrides the account page's privacy-section prompt command. Leave blank to use the preset's own wording.",
      fieldset: 'terminalPrompts',
    }),
    defineField({
      name: 'accountNewsletterPromptCommand',
      title: 'Account Newsletter Prompt Command',
      type: 'string',
      description:
        "Overrides the account page's newsletter-section prompt command. Leave blank to use the preset's own wording.",
      fieldset: 'terminalPrompts',
    }),
    defineField({
      name: 'accountIdentityPromptCommand',
      title: 'Account Identity Prompt Command',
      type: 'string',
      description:
        "Overrides the account page's identity-section prompt command. Leave blank to use the preset's own wording.",
      fieldset: 'terminalPrompts',
    }),
    defineField({
      name: 'bookmarkToastSavedMessage',
      title: 'Bookmark Toast — Saved',
      type: 'string',
      description:
        'Overrides the bookmark button\'s "saved" toast message. Leave blank to use the preset\'s own wording.',
      fieldset: 'bookmarks',
    }),
    defineField({
      name: 'bookmarkToastRemovedMessage',
      title: 'Bookmark Toast — Removed',
      type: 'string',
      description:
        'Overrides the bookmark button\'s "removed" toast message. Leave blank to use the preset\'s own wording.',
      fieldset: 'bookmarks',
    }),
    defineField({
      name: 'blogListEmpty',
      title: 'Blog List Empty',
      type: 'string',
      description:
        "Overrides the blog list page's empty-state message. Leave blank to use the preset's own wording.",
      fieldset: 'emptyStates',
    }),
    defineField({
      name: 'topicEmpty',
      title: 'Topic Empty',
      type: 'string',
      description:
        "Overrides the topic page's empty-state message. Leave blank to use the preset's own wording.",
      fieldset: 'emptyStates',
    }),
    defineField({
      name: 'tagEmpty',
      title: 'Tag Empty',
      type: 'string',
      description:
        "Overrides the tag page's empty-state message. Leave blank to use the preset's own wording.",
      fieldset: 'emptyStates',
    }),
    defineField({
      name: 'topicsEmpty',
      title: 'Topics Empty',
      type: 'string',
      description:
        "Overrides the topics page's empty-state message. Leave blank to use the preset's own wording.",
      fieldset: 'emptyStates',
    }),
    defineField({
      name: 'bookmarksEmpty',
      title: 'Bookmarks Empty',
      type: 'string',
      description:
        "Overrides the bookmarks page's empty-state message. Leave blank to use the preset's own wording.",
      fieldset: 'emptyStates',
    }),
  ],
});
