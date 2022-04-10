#!/usr/bin/env bash

set -euo pipefail

TOOLS="wget aws jq"

check_tools() {
  for tool in $TOOLS; do
    if ! $tool --version &>/dev/null; then
      echo "$tool not installed."
    fi
  done
}

check_env() {
  env=$1
  if [[ ! -v "${env}" ]]; then
    echo "$env is not set"
    exit 1
  fi
}

check_env AWS_ACCOUNT_ID
check_env AWS_PROFILE
check_env AWS_ALIAS
check_env AWS_REGION

check_tools