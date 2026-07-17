#!/bin/sh
# Throwaway scratch file — deliberately fails shellcheck to test the
# ci-watcher subagent's forced-failure reporting path. Never referenced by
# any hook wiring or CI step beyond the blanket `shellcheck .claude/hooks/*.sh`
# glob. Delete before merging anything real; this file has no other purpose.
foo=$1
echo $foo
