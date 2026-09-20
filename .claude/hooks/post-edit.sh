#!/bin/sh
# Both post-edit scripts read the payload from stdin, so an `a && b` chain
# in settings.json starves the second one — fan a single read out instead.
set -u

hooks_dir=$(dirname "$0")
payload=$(cat)

printf '%s' "$payload" | "$hooks_dir/post-edit-prettier.sh"
printf '%s' "$payload" | "$hooks_dir/post-edit-lint.sh"
