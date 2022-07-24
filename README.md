# Fantasy Bundesliga Manager

## Description

This is meant to be an open source self hosted version of the official bundesliga fantasy. If you want to try this out use my hosted version which is located [here](https://bundesliga.lschaefer.xyz)![](https://uptime.lschaefer.xyz/api/badge/15/uptime/720?label=30&labelSuffix=d). For any questions feel free to post a question in the discussions tab.

## Production or Installation

There are 2 options to run this Sqlite and Mariadb. If you are unsure I would recommend sqlite it is faster.

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

## Development

Read the contributing guidelines.

## How to get Bundesliga Api

Make an account on fantasy.bundesliga.com and then look at your cookies and one of the cookies is called acess_token and that is the api key for bundesliga
