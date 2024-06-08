#!/bin/sh
docker compose down --rmi all
docker compose up -d && yarn prisma db push
