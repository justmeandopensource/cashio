FROM node:20.18.3-alpine3.21 AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Accept build-time API URL
ARG VITE_CASHIO_API_BASE_URL
ENV VITE_CASHIO_API_BASE_URL=$VITE_CASHIO_API_BASE_URL
RUN npm run build

FROM nginx:1.27.4-alpine3.21
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/nginx.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
