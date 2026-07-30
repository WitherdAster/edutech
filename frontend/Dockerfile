FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --include=optional
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["/bin/sh", "-c", "export NGINX_PORT=${PORT:-80} && envsubst '${NGINX_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
