FROM node:22-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY index.html ./
COPY vite.config.js ./
COPY frontend ./frontend

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM dev AS build
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:22-alpine AS prod

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY vite.config.js ./

COPY --from=build /app/dist ./dist

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
