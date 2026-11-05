#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./gen.sh <NAMESPACE> <EVENTHUB_OR_SB_ENTITY> <KEY_NAME> <KEY_VALUE> [EXPIRY_SECONDS]
#

NAMESPACE="${1:?namespace required}"
ENTITY="${2:?event hub / queue / topic name required}"
KEY_NAME="${3:?SAS policy name (skn) required}"
KEY_VALUE="${4:?SAS key value required}"
EXPIRY_SECONDS="${5:-3600}"

# Build the resource URI to sign (must include /messages for REST send)
RESOURCE_URI="https://${NAMESPACE}.servicebus.windows.net/${ENTITY}/messages"

# URL-encode helper using python (portable) if jq not installed
urlencode() {
  python3 - <<'PY' "$1"
import sys, urllib.parse
print(urllib.parse.quote(sys.argv[1], safe=''))
PY
}

# URL-encode resource URI for the token fields and the string-to-sign
ENCODED_SR="$(urlencode "${RESOURCE_URI}")"

# Expiry epoch (UTC)
EXPIRY=$(($(date +%s) + EXPIRY_SECONDS))

# String to sign: "<url-encoded-sr>\n<expiry>"
STRING_TO_SIGN="${ENCODED_SR}\n${EXPIRY}"

# Compute HMAC-SHA256 and base64
# (openssl prints "stdin= " prefix unless -binary is used; keep -binary)
SIGNATURE_BASE64=$(printf '%b' "${STRING_TO_SIGN}" \
  | openssl dgst -sha256 -hmac "${KEY_VALUE}" -binary \
  | base64)

# URL-encode the signature for the token
ENCODED_SIG="$(urlencode "${SIGNATURE_BASE64}")"

# Build final SAS token (RAW '&', NOT HTML-escaped)
SAS_TOKEN="SharedAccessSignature sr=${ENCODED_SR}&sig=${ENCODED_SIG}&se=${EXPIRY}&skn=${KEY_NAME}"

echo "Namespace:            ${NAMESPACE}"
echo "Entity:               ${ENTITY}"
echo "Policy (skn):         ${KEY_NAME}"
echo "Expiry (se):          ${EXPIRY} ($(date -u -d "@${EXPIRY}" +'%Y-%m-%d %H:%M:%S' 2>/dev/null || date -u -r "${EXPIRY}" +'%Y-%m-%d %H:%M:%S'))"
echo
echo "SAS Token:"
echo "${SAS_TOKEN}"
 