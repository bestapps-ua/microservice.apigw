#!/bin/bash
pass=$(node -pe 'JSON.parse(process.argv[1]).service.internal.password' "$(cat $PWD/../../config/local.json)");
curl --location --request POST "https://$1/internal/auth/clear" -H "Content-Type: application/json" -d '{"pass":"'$pass'"}';
