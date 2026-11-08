#!/bin/sh
# Runs inside the sandbox after the agent is done. Exit 0 = pass.
# The runner mounts this folder at /grader and the attempt's workspace at /workspace.
set -e
cd /workspace
# 1. Visible test file must be untouched
echo "$(cat /grader/visible.sha256)  orders.test.js" | sha256sum -c - >/dev/null || { echo "FAIL: orders.test.js was modified"; exit 1; }
# 2. Visible + hidden tests must pass
cp /grader/hidden.test.js ./hidden.test.js
node --test
