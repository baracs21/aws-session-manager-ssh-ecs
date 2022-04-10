#!/usr/bin/env bash

set -euo pipefail

AWS_ACCOUNT_ID=$1
AWS_PROFILE=$2
ACTIONS_FILE_PATH=$3

POLICY_NAME=cdk-exec-policy
ACTIONS=$(cat "$ACTIONS_FILE_PATH")
POLICY_DOCUMENT=role-policy.json

create_policy_document() {
  temp_file=$(mktemp)
  cat <<EOF >"$temp_file"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        $ACTIONS
      ],
      "Resource": "*"
    }
  ]
}
EOF
  jq . <"$temp_file" >$POLICY_DOCUMENT
  rm -f "$temp_file"
}

create_policy() {
  policy_arn=arn:aws:iam::$AWS_ACCOUNT_ID:policy/$POLICY_NAME
  if aws iam get-policy --policy-arn "$policy_arn" --profile "$AWS_PROFILE" &>/dev/null; then
    aws iam create-policy-version --policy-arn "$policy_arn" --policy-document file://role-policy.json --set-as-default --profile "$AWS_PROFILE"
  else
    aws iam create-policy --policy-name $POLICY_NAME --policy-document file://role-policy.json --profile "$AWS_PROFILE"
  fi
}

delete_old_policy_versions() {
  policy_arn=arn:aws:iam::$AWS_ACCOUNT_ID:policy/$POLICY_NAME
  delete=$(aws iam list-policy-versions --policy-arn "$policy_arn" --profile "$AWS_PROFILE" | jq -r '.Versions[] | select(.IsDefaultVersion==false) | .VersionId')
  for version in $delete; do
    aws iam delete-policy-version --policy-arn "$policy_arn" --version-id "$version" --profile "$AWS_PROFILE"
  done
}

cleanup() {
  rm -f $POLICY_DOCUMENT
  delete_old_policy_versions
}

create_policy_document
create_policy
cleanup
