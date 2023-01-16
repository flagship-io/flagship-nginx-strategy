FROM node:latest

ARG FS_MODE

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY ./${FS_MODE}/package*.json ./

COPY ./${FS_MODE} ./

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 8081

CMD [ "node", "index.js" ]