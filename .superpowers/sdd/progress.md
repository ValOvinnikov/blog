# Modules-as-documents — progress ledger

Branch: refactor/modules-impl (off main; spec+plan merged via #282)
Plan: docs/superpowers/plans/2026-07-12-modules-as-documents.md
Commit model: subagents commit each task locally; push+PR gated per phase.

- [x] Phase 0 (config): Task 0.1 UPPERCASE HERO_FIELD_MODE (commit 109e6a4, review clean)
- [x] Phase 1 (cms): DONE commits 991c78a..d298921, review clean — 1.1 titleField, 1.2 defineModulesField, 1.3 module docs, 1.4 pages, 1.5 singleton titles, 1.6 Studio desk, 1.7 register+typegen
- [x] Phase 2 (service): DONE commits 450eb59..03cb35c, review clean — 2.1 thin home, 2.2 thin generic, 2.3-2.6 module fetchers, 2.7 namespace
- [x] Phase 3 (ui): DONE commits c3c6989,c3b0b6d, review clean — 3.1 ContentModule, 3.2 CtaModule
- [x] Phase 4 (web): DONE commits d740195..8afcf07, repo-wide green — 4.1 renderer+map, 4.2 per-module components, 4.3 routes, 4.4 SPEC+verify
- [ ] Phase 5: close #262 (done), board, memory

- [x] Salvage branch deleted after Phase 1 review. Hero transformer/query salvaged to $CLAUDE_JOB_DIR/tmp/salvage-home-*.ts for Phase 2.

## Pending side-task (approved 2026-07-12)

- [ ] After Phase 2 lands: separate docs PR off main — add "Prefer per-layer PRs (split only if possible)" convention to CLAUDE.md:100, .claude/skills/develop-feature (§0 Decide the shape), .claude/skills/open-pull-request (new Scope section), MIRRORED to .agents/skills/ copies. Text approved by user. Apply off feature branch to avoid mixing concerns.

## Follow-ups from final review (not blocking merge)

- [ ] Minor #3: HeroModule renders empty <h1> when hero has no title AND no post anywhere (edge case, tested). Needs a fallback design decision. Track as issue.
- [ ] Generic /[slug] route: service.pages.generic.getPage exists but no route + no slugs loader for generateStaticParams. Deferred by design.
- [x] Important #1 (post-list over-fetch) FIXED — GROQ slice, repo-wide green.

## SHIPPED 2026-07-12

- Feature: 22 commits on refactor/modules-impl → PR #283 (closes #242, board Code Review). Repo-wide green; final review clean, over-fetch fixed.
- Docs: per-layer-PR convention → PR #284.
- [x] Side-task done. [x] Salvage branch deleted. Follow-ups (generic route, hero empty-h1) remain open.
