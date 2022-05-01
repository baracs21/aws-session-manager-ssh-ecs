#!/usr/bin/env bash

set -euo pipefail

PROFILE=$1
CLUSTER_NAME=$2
SERVICE_NAME=$3

function get_task_name() {
  tasks=$(aws ecs list-tasks \
    --cluster "$CLUSTER_NAME" \
    --service-name "$SERVICE_NAME" \
    --profile "$PROFILE")
  echo "👷 tasks: $(echo "$tasks" | jq -r '.taskArns | map(split("/") | .[-1]) | join(", ")')"
  taskName=$(echo "$tasks" | jq -r '.taskArns[-1] | split("/") | .[-1]')
  echo "➡️  selected task: ${taskName}"
}

function get_runtime_id() {
  runtimeId=$(aws ecs describe-tasks \
    --tasks "$taskName" \
    --cluster baracs-cluster \
    --profile "$PROFILE" | jq -r '.tasks[0].containers[0].runtimeId')
}

function get_target() {
  get_task_name
  get_runtime_id
  target="ecs:${CLUSTER_NAME}_${taskName}_${runtimeId}"
}

function start_session() {
  echo "➡️  selected cluster: ${CLUSTER_NAME}"
  echo "➡️  selected service: ${SERVICE_NAME}"
  get_target
  echo "🎯 Connecting to target: $target"
  aws ssm start-session \
    --target "$target" \
    --profile "$PROFILE"
}

start_session
