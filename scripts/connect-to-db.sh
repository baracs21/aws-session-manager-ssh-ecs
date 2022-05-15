#!/usr/bin/env bash

set -euo pipefail

PROFILE=$1
DB_CLUSTER=$2
CREDENTIALS=

sshPid=

function cleanup() {
  set +e
  if [ -n "$sshPid" ] && [ -n "$(ps -p "$sshPid")" ]; then
    echo "🔫 Killing SSH tunnel process $sshPid"
    kill -9 "$sshPid"
    killall session-manager-plugin
    while lsof -i tcp:2222 &>/dev/null; do
      echo "⌛️ SSH still listening, give it a bit of time"
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

function start_ssh_tunnel() {
  if [ "$CREDENTIALS" == "" ]; then
    echo "Cluster $DB_CLUSTER not found."
    exit 1
  fi

  port=$(echo "$CREDENTIALS" | jq -r '.port')
  hostname=$(echo "$CREDENTIALS" | jq -r '.host')


  echo "CONNECT"
 # ssh -L 27017:"$DATABASE_NAME":27017 -N -T root@127.0.0.1 -p 2222 -i "$HOME"/.ssh/baracs-tunnel &
 # sshPid=$!
}

function retrieve_credentials() {
  secrets=$(aws secretsmanager list-secrets --profile "$PROFILE" | jq -r '.SecretList | .[] | .ARN')
  for secret in $secrets; do
    secretValue=$(aws secretsmanager get-secret-value --secret-id "$secret" --query 'SecretString' --profile "$PROFILE" | jq -r .)
    clusterName=$(echo "$secretValue" | jq -r .dbClusterIdentifier)
    if [ "$clusterName" == "$DB_CLUSTER" ]; then
#      echo "$secretValue"
      CREDENTIALS=$secretValue
    fi
    break
  done
}

function print_credentials() {
   echo "$CREDENTIALS" | jq -r .
}

function monitor_connection() {
  echo "SSM tunnel established... entering monitoring phase"
  while lsof -i tcp:2222 &>/dev/null; do
    sleep 5
  done
}

retrieve_credentials
start_ssh_tunnel
print_credentials
monitor_connection
