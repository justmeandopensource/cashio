#!/bin/sh
# entrypoint.sh

# Replace ${DOMAIN} in the Nginx config template with the actual domain
envsubst '${DOMAIN}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
exec nginx -g 'daemon off;'
