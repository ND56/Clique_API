#!/bin/bash

API="http://localhost:4741"
URL_PATH="/add-comment"

curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request PATCH \
  --header "Content-Type: application/json" \
  --header "Authorization: Token token=${TOKEN}" \
  --data '{
    "image": {
      "comments": "'"${COMMENTS}"'"
    }
  }'

echo
