FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies including devDependencies
RUN npm install --production=false

COPY . .
RUN npm run build

EXPOSE 3000

# Clean up dev dependencies after build
RUN npm prune --production

CMD ["npm", "run", "start:prod"]