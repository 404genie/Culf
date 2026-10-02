FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json server.mjs ./
EXPOSE 8080
CMD ["npm", "start"]
