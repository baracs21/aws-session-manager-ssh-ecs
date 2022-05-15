#!/usr/bin/env bash

set -euo pipefail

PROFILE=$1
DATABASE_NAME=$2

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
  db_info

  ssh -L 27017:"$DATABASE_NAME":27017 -N -T root@127.0.0.1 -p 2222 -i "$HOME"/.ssh/baracs-tunnel &
  sshPid=$!
}

function retrieve_credentials() {
  aws secretsmanager get-secret-value --secret-id arn:aws:secretsmanager:eu-west-1:501015370583:secret:baracsdocdbSecret500EB901-ygNOF9XJc5yj-KKxH6f | jq -r '.SecretString' | jq .
}

start_ssh_tunnel
retrieve_credentials
