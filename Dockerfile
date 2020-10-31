FROM node:12 as build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . . 

RUN npm run build

RUN npm run test

FROM node:12 as publish

COPY --from=build package*.json ./

RUN npm ci --production

COPY server.js .
COPY build .

CMD [ "node", "server.js" ]