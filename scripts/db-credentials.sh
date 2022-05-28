#!/usr/bin/env bash

set -euo pipefail

PROFILE=$1
SECRET_NAME=$2
CREDENTIALS=

function retrieve_credentials() {
  secret=$SECRET_NAME
  secretValue=$(aws secretsmanager get-secret-value --secret-id "$secret" --query 'SecretString' --profile "$PROFILE" | jq -r .)
  CREDENTIALS=$secretValue
}

function print_credentials() {
  echo "$CREDENTIALS" | jq -r .
}

retrieve_credentials
print_credentials