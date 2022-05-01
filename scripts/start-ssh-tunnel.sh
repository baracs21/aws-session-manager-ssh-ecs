#!/usr/bin/env bash

set -euo pipefail

PROFILE=$1
CLUSTER_NAME=$2
SERVICE_NAME=$3

ssmPid=

function cleanup() {
  set +e
  if [ -n "$ssmPid" ] && [ -n "$(ps -p "$ssmPid")" ]; then
    echo "🔫 Killing SSM tunnel process $ssmPid"
    kill -9 "$ssmPid"
    killall session-manager-plugin
    while lsof -i tcp:2222 &>/dev/null; do
      echo "⌛️ SSM still listening, give it a bit of time"
      sleep 5
    done
  fi
  set -e
}

function exitTrap() {
  cleanup
  exit 0
}
trap exitTrap EXIT

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

function download_key() {
  key=$(aws ssm get-parameter \
    --with-decryption \
    --name tunnel-ssh-private-key \
    --profile "$PROFILE" | jq -r '.Parameter | .Value')
  echo "$key" >"$HOME"/.ssh/baracs-tunnel
  chmod 600 "$HOME"/.ssh/baracs-tunnel
  echo "✅ private ssh key saved to $HOME/.ssh/baracs-tunnel"
}

function connect() {
  echo "➡️  selected cluster: ${CLUSTER_NAME}"
  echo "➡️  selected service: ${SERVICE_NAME}"
  get_target
  echo "🎯 Connecting to target: $target"
  aws ssm start-session \
    --target "$target" \
    --document-name "AWS-StartPortForwardingSession" \
    --profile "$PROFILE" \
    --parameters '{"portNumber": ["2222"], "localPortNumber": ["2222"]}' &
  ssmPid=$!
  echo "🔌 SSM tunnel runs in process with pid ${ssmPid}, waiting for successful establishment"
  while ! lsof -i tcp:2222 &>/dev/null; do
    echo "⏳ Tunnel not ready, yet..."
    sleep 5
  done
}

function monitor_connection() {
  echo "✅ SSM tunnel established... entering monitoring phase"
  while lsof -i tcp:2222 &>/dev/null; do
    sleep 5
  done
  echo "👻 SSM tunnel disappeared... I don't waste time finding it, let's re-create it"
}

download_key
connect
monitor_connection
