FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add curl

RUN npm install --production

COPY . .

EXPOSE 3001

CMD [ "node", "index.js" ]
