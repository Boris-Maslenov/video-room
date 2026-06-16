FROM node:22
WORKDIR /app
COPY *.json ./
COPY src ./src
RUN npm ci
RUN npm run build
CMD ["npm", "run", "start"]
