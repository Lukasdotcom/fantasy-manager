FROM node:20-alpine
ENV NODE_ENV=development
RUN mkdir /app
WORKDIR /app
# Sets the default configuration
ENV NEXTAUTH_SECRET=hkf9eUXAZKjw99/hZ4Rrw7aNe47qxB+QuojMwmxbFqA=
ENV NEXTAUTH_URL_INTERNAL=http://127.0.0.1:3000
CMD npm run dev
EXPOSE 3000