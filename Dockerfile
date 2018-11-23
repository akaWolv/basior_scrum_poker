FROM node:10.13-alpine

WORKDIR /usr/app

COPY package.json ./
RUN npm install --quiet --ignore-optional
#RUN npm install --no-progress

#COPY . .

#CMD npm run start:dev
# webpack-dev-server --host 0.0.0.0 --hot
