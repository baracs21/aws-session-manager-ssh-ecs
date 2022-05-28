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

function download_key() {
  key=$(aws ssm get-parameter \
    --with-decryption \
    --name tunnel-ssh-private-key \
    --profile "$PROFILE" | jq -r '.Parameter | .Value')
  echo "$key" >"$HOME"/.ssh/baracs-tunnel
  chmod 600 "$HOME"/.ssh/baracs-tunnel
  echo "private ssh key saved to $HOME/.ssh/baracs-tunnel"
}

function start_ssh_tunnel() {
  port=$(echo "$CREDENTIALS" | jq -r '.port')
  hostname=$(echo "$CREDENTIALS" | jq -r '.host')

  ssh -N -L 27019:"$hostname":"$port" -T -o "StrictHostKeyChecking=no" root@127.0.0.1 -p 2222 -i "$HOME"/.ssh/baracs-tunnel &
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
  wget -O "$HOME"/.aws/rds-combined-ca-bundle.pem https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem &>/dev/null
  username=$(echo "$CREDENTIALS" | jq -r '.username')
  password=$(echo "$CREDENTIALS" | jq -r '.password')

  mongosh \
    --username "$username" \
    --password "$password" \
    --authenticationDatabase admin \
    --tls \
    --tlsCAFile "$HOME"/.aws/rds-combined-ca-bundle.pem \
    --tlsAllowInvalidHostnames \
    --tlsAllowInvalidCertificates \
    mongodb://127.0.0.1:27019
}

retrieve_credentials "$SECRET_NAME"
download_key
start_ssh_tunnel
connect
