# Fantasy Bundesliga Manager

## Description

This is meant to be an open source self hosted version of the official bundesliga fantasy. If you want to try this out use my hosted version which is located [here](https://bundesliga.lschaefer.xyz)![](https://uptime.lschaefer.xyz/api/badge/15/uptime/720?label=30&labelSuffix=d). For any questions feel free to post a question in the discussions tab.

## Features

1. Completely free and open source.
2. Unlimited users and unlimited leagues.
3. Customize starting money.
4. Customize starred player bonus.
5. Limit transfer amount(Note all users are allowed unlimited transfers while they have an empty squad).
6. Ability to allow players to be bought by multiple users in the same league.
7. Ranking tables for(Only in leagues):
   1. Top points for every matchday
   2. Top points in total
8. Many ways to search through players:
   1. By price
   2. By total points
   3. By average points
   4. By the last match points(Requires the server to have been up for the last match day)
   5. By Club
   6. By Name
   7. By Position
9. Download player data as json or csv
10. See all historical user data(As long as the server was up).
11. And all of these features in a Modern Responsive UI available in a light and dark theme.

## Screenshots

Here is a sample screenshot for more go to the [screenshots folder](public/screenshots/) which is in the public folder or to the [main page of my hosted version](https://bundesliga.lschaefer.xyz)![](https://uptime.lschaefer.xyz/api/badge/15/uptime/720?label=30&labelSuffix=d).
![Screenshot of League page Dark Theme](public/screenshots/MainDark.webp?raw=true)
![Screenshot of League Page Light Theme](public/screenshots/MainLight.webp?raw=true)

## Production or Installation

There are 2 options to run this Sqlite and Mariadb. If you are unsure I would recommend sqlite it is faster. If you would like to install this without docker-compose you can use the [Dockerless](#dockerless) version.

### Sqlite

1. First download this file and edit the file to your preferences.

```
wget 'https://raw.githubusercontent.com/Lukasdotcom/bundesliga-manager/main/docker/docker-compose.yaml'
```

2. Then run this.

```
docker-compose up
```

### Mariadb

1. First download this file and edit the file to your preferences.

```
wget 'https://raw.githubusercontent.com/Lukasdotcom/bundesliga-manager/main/docker/mariadb/docker-compose.yaml'
```

2. Then run this.

```
docker-compose up
```

### Dockerless

Required Tools:

- [Nodejs](https://nodejs.org/en/download/) ≥ 18
- [Git](https://git-scm.com/downloads)

1. First clone this git repository

```
git clone -b stable https://github.com/lukasdotcom/bundesliga-manager
```

2. Then copy the .env.sample file located in the docker folder. Edit the values like mentioned in the file and then put the contents into a file called .env.local in the root folder of the project
3. Run the command below and the webserver will be exposed on port 3000

```
npm run start
```

4. To update this just run the command below in the git repository. Then stop the website and start it up again.

```
git pull
```

## Development

Read the contributing guidelines.

## How to get Bundesliga Api

Make an account on fantasy.bundesliga.com and then look at your cookies and one of the cookies is called acess_token and that is the api key for bundesliga

## Analytics

This service collects some simple analytics when you host this service that currently includes only the following information. This is collected daily.

1. serverID - This is a random id that is generated the first time the server boots.
2. version - The version of the server.
3. users - The number of users.
4. activeUsers - The number of users that were logged in on that day.
5. Then for every type of league (Bundesliga, EPL, etc) there are 2 pieces of data collected:
   1. Active Users - The number of Active Users in a league with that type.
   2. Users - The number of users in a league of this type.
