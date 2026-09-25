FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 5173

# Replace default port 80 with 5173
RUN sed -i 's/listen       80;/listen       5173;/g' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
