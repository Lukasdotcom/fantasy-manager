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