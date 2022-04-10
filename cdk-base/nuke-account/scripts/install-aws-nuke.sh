#!/usr/bin/env bash

set -euo pipefail

wget -c https://github.com/rebuy-de/aws-nuke/releases/download/v2.16.0/aws-nuke-v2.16.0-linux-amd64.tar.gz -O - | sudo tar -xz -C /usr/local/bin
sudo mv /usr/local/bin/aws-nuke-v2.16.0-linux-amd64 /usr/local/bin/aws-nuke
