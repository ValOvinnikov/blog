---
title: People
status: built
layers: [config, studio, service, ui, web]
code:
  - packages/studio/src/schema-types/documents/person/**
  - packages/studio/src/schema-types/objects/social-profile/**
  - packages/studio/src/structure/sections/people-section.ts
  - packages/service/src/shared/fragments/person/**
  - packages/service/src/shared/transformers/person/**
  - packages/service/src/shared/fragments/social-profile/**
  - packages/service/src/shared/transformers/social-profile/**
  - packages/ui/src/components/atoms/avatar/**
  - apps/web/src/components/shared/social-links/**
epics: [3600]
---

# People

## What it does

A person is one reusable record for someone the site credits or introduces: an author, a team member, or the subject of a profile hero. Editors enter a person once (name, photo, role, bio, social links and an optional profile page) and every place that shows that person reads the same record. There is no public person page; a byline links to whichever page the editor chose as the person's profile.

## Surfaces and routes

- **Studio** — the People sidebar section, a single flat list of `person` documents.
- **Public** — no route of its own. A person appears as:
  - the post byline (name, avatar, link to the profile page) and the post's `author` in metadata and `BlogPosting` JSON-LD (name only) — see [posts](./posts.md);
  - `module_heroProfile` (photo, with switchable role, bio and social links) — see [heroes](./heroes.md);
  - `module_team` members (photo, name, role, optional bio and social links) — see [team-module](./team-module.md).
- No platform surface.

## Data

- `person` — `name` (required, at most 100 characters, one value for every language), `image` (`localizedImageWithAlt`: one image, alt text per language), `role` (per-language string, at most 100), `bio` (per-language paragraph text), `socialLinks` (array of `socialProfile`) and `profilePage` (optional reference to a `link` document).
- `socialProfile` — a required reference to a `link` document and a required `platform` from `SOCIAL_PLATFORMS` in `@blog/config` (X, GitHub, LinkedIn, YouTube, Instagram, Mastodon, Bluesky, Facebook, Threads, RSS), which picks the icon.
- `person` is not a translated document: there is one record per person, and only the role, bio and image alt vary by language.
- Service shapes: `personCardFragment` → `TPersonCard` (id, name, image, `profileUrl` resolved from the link) for post cards and bylines; `personDetailFragment` → `TPersonProfile` (adds role, bio, social links) for the post detail, the profile hero and team.
- **Caching** — loaders that read a person carry the `author` tag (post detail, profile hero) or `modules:team`. Publishing a person purges `author`, `posts` and `modules:team`, then falls back to a whole-layout path purge (see [rendering-and-caching](./rendering-and-caching.md)).

## Configuration

- Editors create and edit people in the Studio; nothing is set in the platform, and people are not plan-gated.
- Which fields show is decided where the person is used: Team's "Show Bios" and "Show Social Links" switches, and the profile hero's "Show Role", "Show Social Links" and "Show Bio" switches. The profile hero also has its own `image` field, which overrides the person's photo. The byline always shows name and avatar only.
- No [Voice](./voice.md) or [Look](./look.md) setting is specific to people.

## Constraints and invariants

- `page_post.author`, `module_heroProfile`'s person and every `module_team` member are required strong references, so a person in use cannot be deleted.
- A person with no image renders an initials badge (`Avatar`) derived from the name.
- `profilePage` and every social link go through a `link` document, so they follow a renamed or moved target (see [links](./links.md)); a person with no profile page gets an unlinked byline.
- The role is plain text; the bio is portable text and renders only where the consuming surface shows bios.
- Social links render as icon-only links whose accessible name comes from the platform (`socialLinks.linkAriaLabel`), not from the `link` document's label; the link supplies only the href and target.

## Dependencies

- Layers: `config` (`SOCIAL_PLATFORMS`), `studio`, `service`, `ui` (`Avatar`), `web` (`SocialLinks`).
- Features: [posts](./posts.md), [heroes](./heroes.md), [team-module](./team-module.md), [links](./links.md), [rendering-and-caching](./rendering-and-caching.md), [languages](./languages.md).
- Env vars: none.

## Entry points

- `packages/studio/src/schema-types/documents/person/person.ts`
- `packages/studio/src/schema-types/objects/social-profile/social-profile.ts`
- `packages/service/src/shared/fragments/person/person.ts`
- `packages/service/src/shared/transformers/person/to-person-card.ts`, `to-person-profile.ts`
- `packages/ui/src/components/atoms/avatar/avatar.tsx`
- `apps/web/src/components/shared/social-links/social-links.tsx`

## Tests and stories

- Service: `person.test.ts` (fragment), `to-person-card.test.ts`, `to-person-profile.test.ts`, `to-social-profiles.test.ts`.
- UI: `avatar.test.tsx`, `avatar.stories.tsx`.
- Web: `social-links.test.tsx`, `social-link.test.tsx`, `social-links.stories.tsx`; byline coverage sits in `post-article.test.tsx`, and the hero and team modules carry their own.

## Related

- #3600 — whether link targets reached through a person (profile page, social links) need precise cache purging.
