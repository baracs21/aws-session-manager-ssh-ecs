#!/usr/bin/env bash

set -eo pipefail

AWS_ACCOUNT=$1
AWS_PROFILE=$2
AWS_ALIAS=$3

create_alias() {
  if ! aws iam list-account-aliases | jq '.AccountAliases | .[]' | grep "$AWS_ALIAS"; then
    aws iam create-account-alias --account-alias "$AWS_ALIAS" --profile "$AWS_PROFILE"
  fi
}

create_alias
sed -e 's/{{ACCOUNT}}/'"$AWS_ACCOUNT"'/' -e 's/{{ALIAS}}/'"$AWS_ALIAS"'/' ../config/nuke-config-template.yml >../config/nuke-config.yml
trap "rm -f ../config/nuke-config.yml" EXIT

aws-nuke -c ../config/nuke-config.yml --profile "$AWS_PROFILE"

read -r -p "Continue (y/n)? " CONT
if [ "$CONT" = "y" ]; then
  aws-nuke -c ../config/nuke-config.yml --no-dry-run --profile "$AWS_PROFILE"
else
  exit 0;
fi
