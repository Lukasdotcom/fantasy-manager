# League Support Level

Not every league has perfect support.

- :1st_place_medal: is the top level of support so it is tested/used actively by me.
- :2nd_place_medal: is the second level of support which means it is not activly maintained/tested but will recieve bug fixes
- :3rd_place_medal: means that the league has no support anymore or is done.
- :new: means that the league is new and may have some unforeseen bugs.

| League     | Support           |
| ---------- | ----------------- |
| Bundesliga | :1st_place_medal: |
| EPL :new:  | :2nd_place_medal: |

# How to Enable leagues

## Bundesliga

1. Add an enviromental variable called BUNDESLIGA_API and set it to the value you get in step 2.
2. Make an account on fantasy.bundesliga.com and then look at your cookies and one of the cookies is called acess_token and that is the api key for bundesliga.

# English Premier League

1. Set the enviromental variable ENABLE_EPL to enabled

# How to add another league

## Required

- Did you add a check on if it is enabled in the ./Modules/database.ts file?
- Did you add a way for the data to be grabbed and updated in the ./scripts/update.ts?

## Not Required Owner of Repository Will do this

- Did you add add the league to the analytics database table and add it in the analytics request(entrypoint.ts) and api response(./pages/api/analytics.ts).
- Did you add the league to the analytics graph in the admin page.
