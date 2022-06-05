# Description
This is meant to be an open source self hosted version of the official bundesliga fantasy.
# Develop
Download this git repository by running
```
git clone github.com/lukasdotcom/bundesliga
```
Build the docker container in the development folder by running
```
docker build development/. -t lukasdotcom/bundesliga:development
```
Edit the docker-compose file in the development folder folowing the steps indicated in the file and then run it by running
```
docker-compose up
```
When you are done editing run this command and fix all the errors
```
npm run lint
```
# How to get Bundesliga Api
Make an account on fantasy.bundesliga.com and then look at your cookies and one of the cookies is called acess_token and that is the api key for bundesliga
# Goals
Currently the goals are just to get feauture parity with the official bundesliga fantasy.
# Production
This is currently in active development and not meant to be used in production yet(It is also pretty useless right now because the bundeslia season has not started yet)
