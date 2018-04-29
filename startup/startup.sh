#!/bin/sh
cd /usr/src/app
npm install
npm install -g nodemon
nodemon -L server.js