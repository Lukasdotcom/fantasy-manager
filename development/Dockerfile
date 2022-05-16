FROM ubuntu:jammy
ENV NODE_ENV=development
ENV DEBIAN_FRONTEND noninteractive
# Used to install all the required software
RUN apt update
RUN apt upgrade -y
RUN apt install -y nodejs --no-install-recommends
RUN apt install -y npm --no-install-recommends
RUN mkdir /var/www
RUN mkdir /var/www/bundesliga
WORKDIR /var/www/bundesliga
# Sets the default configuration
ENV ADMIN_PASSWORD=password
ENV NEXTAUTH_SECRET=hkf9eUXAZKjw99/hZ4Rrw7aNe47qxB+QuojMwmxbFqA=
ENV NEXTAUTH_URL=https://example.com
ENV NEXTAUTH_URL_INTERNAL=http://127.0.0.1:3000
ENV MIN_UPDATE_TIME=120
CMD npm run dev
EXPOSE 3000