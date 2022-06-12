# Used to build the project
FROM node:16-alpine AS builder
ENV NODE_ENV production
RUN apk add git
RUN git clone https://github.com/Lukasdotcom/Bundesliga
WORKDIR /Bundesliga
RUN npm ci
RUN npm run build

# Production image, copy all the files and run next
FROM node:16-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
# Sets the default configuration
ENV NEXTAUTH_SECRET=hkf9eUXAZKjw99/hZ4Rrw7aNe47qxB+QuojMwmxbFqA=
ENV NEXTAUTH_URL=https://example.com
ENV NEXTAUTH_URL_INTERNAL=http://127.0.0.1:3000
ENV MIN_UPDATE_TIME=120
# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /Bundesliga/next.config.js ./next.config.js
COPY --from=builder /Bundesliga/public ./public
COPY --from=builder /Bundesliga/.next ./.next
COPY --from=builder /Bundesliga/node_modules ./node_modules
COPY --from=builder /Bundesliga/package.json ./package.json

EXPOSE 3000

ENV PORT 3000

CMD npm run start