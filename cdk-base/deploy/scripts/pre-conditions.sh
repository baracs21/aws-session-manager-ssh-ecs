#!/usr/bin/env bash

set -eo pipefail

ENVS="AWS_ACCOUNT_ID AWS_PROFILE AWS_REGION"
TOOLS="cdk npm"

check_env_variables() {
  for env in $ENVS; do
    if [[ -z "${!env}" ]]; then
      echo "Variable $env not set."
      exit 1
    fi
  done
}

check_tools() {
  for tool in $TOOLS; do
    if ! $tool --version &>/dev/null; then
      echo "$tool not installed."
    fi
  done
}

check_env_variables
check_tools
