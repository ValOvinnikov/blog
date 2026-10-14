---
title: Location module
status: planned
layers: [studio, service, ui, web]
code:
  - apps/web/src/components/shared/json-ld/**
epics: [2792, 2826]
---

# Location module

## What it does

A business or venue site will show where it is and when it is open: an address, opening hours listed per day, and a map. The same data will feed `LocalBusiness` structured data so search engines can show it. Nothing of the module exists, and its design has not been written: only the epic's one-line scope and an open design ticket.

## Surfaces and routes

- **Public site** — a planned `module_location` section. Which page types allow it is undecided.
- **Studio** — a planned `module_location` document.
- **Platform** — nothing.

## Data

- No schema, loader or view model exists.
- Decided at epic level: an address, opening hours, and a map embed.
- Open questions the design ticket must settle: the hours model (per day, split shifts, exceptions), the map provider, the JSON-LD mapping, and whether one module holds several locations.
- Content will be Sanity-only, cached with the module loaders' tags, like every other module.

## Configuration

- **Editor** — would author the address, hours and map in Studio.
- No plan, capability, Look or Voice reach is decided. Its labels (day names, "Open", "Closed") would be fixed product copy unless the design says otherwise.

## Constraints and invariants

What is decided, or follows from features already built:

- Opening hours render per day.
- The `LocalBusiness` JSON-LD must validate. It goes through the shared `JsonLd` component, which every structured-data block on the site already uses.
- The map follows the embed module's rules: a provider from the embed module's supported set (which one is still undecided), iframe only, never loaded before the visitor allows External media, with `ConsentPlaceholder` standing in until then.
- Day names and times are formatted in `apps/web`; `@blog/ui` takes them as strings.

## Dependencies

- Layers: `studio`, `service`, `ui`, `web`.
- Features: ./embed-module.md (the map and its consent gate), ./consent-and-analytics.md, ./seo-and-feeds.md (structured data), ./module-system.md, ./languages.md (day names per locale).
- Env vars: none.

## Entry points

Nothing exists. The structured-data pattern it would follow:

- `apps/web/src/components/shared/json-ld/json-ld.tsx`
- `apps/web/src/components/features/faq-page-schema/faq-page-schema.tsx` (module-derived JSON-LD, emitted by the home, landing, topic and tag pages from the FAQ modules they hold — the precedent for where `LocalBusiness` would be emitted)

## Tests and stories

None. `json-ld.test.tsx` covers the shared component.

## Related

- #2792 — `module_location` epic.
- #2826 — design ticket: hours model, map provider, JSON-LD mapping, multiple locations.
