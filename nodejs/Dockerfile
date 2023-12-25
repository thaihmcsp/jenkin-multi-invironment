FROM node:16

ARG BUILD_ENV=${BUILD_ENV}
ARG APP_PORT=${APP_PORT}

COPY package*.json ./

RUN npm install

COPY . .

COPY .env.${BUILD_ENV:-dev} ./.env

EXPOSE 3000

CMD [ "npm", "start" ]