#!/usr/bin/env bash

set -euo pipefail

PROFILE=$1
SECRET_NAME=$2
CREDENTIALS=

sshPid=

function cleanup() {
  set +e
  if [ -n "$sshPid" ] && [ -n "$(ps -p "$sshPid")" ]; then
    echo "Killing SSH tunnel process $sshPid"
    kill -9 "$sshPid"
    while lsof -i tcp:27019 &>/dev/null; do
      echo "SSH still listening, give it a bit of time"
      sleep 5
    done
  fi
  set -e
  rm -rf rds-combined-ca-bundle.pem
}

function exitTrap() {
  cleanup
  exit 0
}
trap exitTrap EXIT

function start_ssh_tunnel() {
  port=$(echo "$CREDENTIALS" | jq -r '.port')
  hostname=$(echo "$CREDENTIALS" | jq -r '.host')

  ssh -L 27019:"$hostname":"$port" -N -T root@127.0.0.1 -p 2222 -i "$HOME"/.ssh/baracs-tunnel &
  sshPid=$!
}

function retrieve_credentials() {
  secret=$SECRET_NAME
  secretValue=$(aws secretsmanager get-secret-value --secret-id "$secret" --query 'SecretString' --profile "$PROFILE" | jq -r .)
  CREDENTIALS=$secretValue
}

function print_credentials() {
  echo "$CREDENTIALS" | jq -r .
}

connect() {
  wget -O "$HOME"/.aws/rds-combined-ca-bundle.pem https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem
  username=$(echo "$CREDENTIALS" | jq -r '.user')
  password=$(echo "$CREDENTIALS" | jq -r '.password')

  mongo \
    --uri='mongodb://127.0.0.1:27019' \
    --username="$username" \
    --authenticationDatabase=admin \
    --password="$password" \
    --ssl \
    --sslCAFile="$HOME"/.aws/rds-combined-ca-bundle.pem \
    --tlsInsecure
}

retrieve_credentials "$SECRET_NAME"
start_ssh_tunnel
print_credentials
connect
