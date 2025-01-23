FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install --production=false

COPY . .

# Debug steps
RUN ls -la
RUN npm run build
RUN ls -la dist

EXPOSE 3000

RUN npm prune --production

CMD ["npm", "run", "start:prod"]