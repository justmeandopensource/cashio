FROM node:24-alpine3.22 AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Accept build-time API URL
ARG VITE_CASHIO_API_BASE_URL
ENV VITE_CASHIO_API_BASE_URL=$VITE_CASHIO_API_BASE_URL
RUN npm run build

FROM nginx:1.29-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/nginx.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
