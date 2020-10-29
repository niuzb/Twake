#!/bin/sh

echo $1

if [ "$1" = "dev" ]
then
  npm install
  npm run dev
else
  if test -f "/configuration/production.json"; then
    cp /configuration/* /twake-node/config/
  fi

  npm run serve
fi

