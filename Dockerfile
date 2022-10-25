FROM node:18-alpine
# Used to build the project
ENV NODE_ENV production
RUN mkdir app
WORKDIR /app
COPY components components
COPY Modules Modules
COPY pages pages
COPY public public
COPY scripts scripts
COPY styles styles
COPY .eslintrc.json .eslintrc.json
COPY next.config.js next.config.js
COPY package-lock.json package-lock.json
COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY tsconfig2.json tsconfig2.json
COPY types types
RUN npm ci
# Sets the default configuration
ENV NEXTAUTH_SECRET=hkf9eUXAZKjw99/hZ4Rrw7aNe47qxB+QuojMwmxbFqA=
ENV NEXTAUTH_URL_INTERNAL=http://127.0.0.1:3000
ENV MIN_UPDATE_TIME=120
ENV MIN_UPDATE_TIME_TRANSFER=3600
ENV BCRYPT_ROUNDS=9
# You only need to copy next.config.js if you are NOT using the default configuration

EXPOSE 3000

ENV PORT 3000

CMD npm run start