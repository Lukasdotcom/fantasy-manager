# Fantasy Bundesliga Manager
## Description
This is meant to be an open source self hosted version of the official bundesliga fantasy. If you want to try this out use my hosted version which is located [here](https://bundesliga.lschaefer.xyz)![](https://uptime.lschaefer.xyz/api/badge/15/uptime/720?label=30&labelSuffix=d)
## Production or Installation
First download this file and edit the file to your preferences.
```
wget 'https://raw.githubusercontent.com/Lukasdotcom/Bundesliga/main/docker/docker-compose.yaml'
```
Then run this.
```
docker-compose up
```

## Development
Download this git repository by running
```
git clone github.com/lukasdotcom/bundesliga
```
Edit the docker-compose file in the development folder folowing the steps indicated in the file and then run it by running
```
docker-compose up
```
When you are done editing run this command in the docker container and fix all the errors.
```
npm run lint
```
## How to get Bundesliga Api
Make an account on fantasy.bundesliga.com and then look at your cookies and one of the cookies is called acess_token and that is the api key for bundesliga