# Fantasy Bundesliga Manager

## Description

This is meant to be an open source self hosted version of the official bundesliga fantasy. If you want to try this out use my hosted version which is located [here](https://bundesliga.lschaefer.xyz)![](https://uptime.lschaefer.xyz/api/badge/15/uptime/720?label=30&labelSuffix=d). For any questions feel free to post a question in the discussions tab.

## Features

1. Completly free and open source.
2. Unlimited users and unlimited leagues.
3. Customize starting money.
4. Limit transfer amount
   1. Note all users are allowed unlimited transfers while they have an empty squad
5. Ability to allow players to be bought by multiple users in the same league.
6. Ranking tables for(Only in leagues):
   1. Top points for every matchday
   2. Top points in total
7. Many ways to search through players:
   1. By price
   2. By total points
   3. By average points
   4. By the last match points(Requires the server to have been up for the last match day)
   5. By Club
   6. By Name
   7. By Position

## Production or Installation

There are 2 options to run this Sqlite and Mariadb. If you are unsure I would recommend sqlite it is faster. If you would like to install this without docker-compose you can use the [Dockerless](#dockerless) version.

### Sqlite

1. First download this file and edit the file to your preferences.

```
wget 'https://raw.githubusercontent.com/Lukasdotcom/Bundesliga/main/docker/docker-compose.yaml'
```

2. Then run this.

```
docker-compose up
```

### Mariadb

1. First download this file and edit the file to your preferences.

```
wget 'https://raw.githubusercontent.com/Lukasdotcom/Bundesliga/main/docker/mariadb/docker-compose.yaml'
```

2. Then run this.

```
docker-compose up
```

### Dockerless

1. First clone this git repository

```
git clone https://github.com/lukasdotcom/Bundesliga
```

2. Run the command below and the webserver will be exposed on port 3000

```
npm run start
```

## Development

Read the contributing guidelines.

## How to get Bundesliga Api

Make an account on fantasy.bundesliga.com and then look at your cookies and one of the cookies is called acess_token and that is the api key for bundesliga
