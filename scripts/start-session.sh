#!/usr/bin/env bash

set -euo pipefail

CLUSTER_ARN=$(aws ecs list-clusters | jq -r '.clusterArns | .[0]')
TASK_ARN=$(aws ecs list-tasks --cluster "$CLUSTER_ARN"| jq -r '.taskArns | .[0]')
RUNTIME_ID=$(aws ecs describe-tasks --tasks "$TASK_ARN" --cluster "$CLUSTER_ARN" | jq -r '.tasks | .[] | .containers | .[0] | .runtimeId')

target() {
  clusterName=$(echo "$CLUSTER_ARN" | cut -d "/" -f2)
  taskName=$(echo "$TASK_ARN" | cut -d "/" -f3)

  echo "ecs:${clusterName}_${taskName}_${RUNTIME_ID}"
}

target=$(target)
aws ssm start-session --target "$target"
