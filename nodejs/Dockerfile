FROM node:16

ARG BUILD_ENV=${BUILD_ENV}

COPY package*.json ./

RUN npm install

COPY . .

COPY .env.${BUILD_ENV:-dev} ./.env

EXPOSE 3001

CMD [ "npm", "start" ]