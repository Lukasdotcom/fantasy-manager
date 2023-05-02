# League Support Level

Not every league has perfect support. This is the levels of support for all the leagues officialy added in the app.

- :1st_place_medal: is the top level of support so it is tested/used actively by me.
- :2nd_place_medal: is the second level of support which means it is not activly maintained/tested but will recieve bug fixes
- :3rd_place_medal: means that the league has no support anymore or is done.
- :new: means that the league is new and may have some unforeseen bugs.

| League       | Support           |
| ------------ | ----------------- |
| Bundesliga   | :1st_place_medal: |
| EPL          | :2nd_place_medal: |
| WorldCup2022 | :3rd_place_medal: |

# How to Enable leagues

## Bundesliga

1. Add an enviromental variable called BUNDESLIGA_API and set it to the value you get in step 2.
2. Make an account on fantasy.bundesliga.com and then look at your cookies and one of the cookies is called acess_token and that is the api key for bundesliga.

# English Premier League

1. Set the enviromental variable ENABLE_EPL to enabled

# World Cup 2022

1. Set the enviromental variable ENABLE_WORDCUP2022 to enabled

# How to add another league

## Required

- Did you add a check on if it is enabled in the ./Modules/database.ts file?
- Did you add a data getter in ./scripts/data folder?
- Did you set the types for the data getter functions result in ./types/data/${Name of League} using [JSON to TS](https://jsonformatter.org/json-to-typescript)?
- Did you add that script in the getter dictionary in ./scripts/update.ts?
- If the aspect ratio on the picture is not 1 by 1 did you make sure to change the width and height in ./components/player.js and ./pages/player/[league].[uid].js?
- Did you update the rules page for this league?

## Not Required Owner of Repository Will do this

- Add to support list.
