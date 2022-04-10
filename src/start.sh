#!/usr/bin/env bash

set -euo pipefail

ssh-keygen -q -t rsa -N '' -f ~/.ssh/id_rsa <<<y >/dev/null 2>&1
cat ~/.ssh/id_rsa.pub > ~/.ssh/authorized_keys

aws --version

aws ssm put-parameter --name tunnel-ssh-private-key --value "$(cat ~/.ssh/id_rsa)" --type "SecureString" --overwrite

service ssh start

./go/bin/app