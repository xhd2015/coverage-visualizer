#!/usr/bin/env bash
set -eo pipefail

# cors=*: allow tff files to be loaded
http-server -c-1 '--cors=*' "--port=${PORT}" src/open