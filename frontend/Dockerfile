FROM node:22-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY index.html ./
COPY vite.config.ts tsconfig.json tsconfig.node.json ./
COPY frontend ./frontend

RUN chown -R node:node /app
USER node

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM dev AS build
ARG VITE_API_URL=""
ARG VITE_STRIPE_PUBLISHABLE_KEY=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
RUN npm run build
