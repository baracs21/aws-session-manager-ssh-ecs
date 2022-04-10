#!/usr/bin/env bash

set -euo pipefail

AWS_ACCOUNT_ID=$1
AWS_REGION=$2
AWS_PROFILE=$3

cdk bootstrap --cloudformation-execution-policies 'arn:aws:iam::'"$AWS_ACCOUNT_ID"':policy/cdk-exec-policy' aws://"$AWS_ACCOUNT_ID"/"$AWS_REGION" --profile "$AWS_PROFILE"

