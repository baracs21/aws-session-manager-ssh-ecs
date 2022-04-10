#!/usr/bin/env bash

set -euo pipefail

MAIN_ACCOUNT_ID=$1

STAGE_CONFIG=../config/stages.json
STAGES=$(jq -r '.[] | .stage' <$STAGE_CONFIG)

for stage in $STAGES; do
  account_id=$(jq -r '.[] | select(.stage=="'"$stage"'") | .account_id' <$STAGE_CONFIG)
  profile=$(jq -r '.[] | select(.stage=="'"$stage"'") | .profile' <$STAGE_CONFIG)
  region=$(jq -r '.[] | select(.stage=="'"$stage"'") | .region' <$STAGE_CONFIG)
  ./create-policy.sh "$account_id" "$profile"
  cdk bootstrap --trust "$MAIN_ACCOUNT_ID" --cloudformation-execution-policies 'arn:aws:iam::'"$account_id"':policy/cdk-exec-policy' aws://"$account_id"/"$region" --profile "$profile"
done
