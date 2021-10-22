# knyte.space
Another point of view on modular semantics development of knowledge bases.

## ussage
knyte.space is a web operational system implementing fileless conception of semantic web. So it can be used in any activity related to knowledge, information and data processing.

## toolset
### Google Chrome
### GitHub
Web service + Desktop app
### VS Code
### Heroku
Node dyno + Postgres add-on
### TablePlus

## infrastructure
Entire project made to be hosted in a single Heroku app.
### db
Install add-on Heroku Postgres to the target app.
Restore db from actual dump, stored in "db dumps" folder, follow [instruction](https://devcenter.heroku.com/articles/heroku-postgres-backups#restoring-backups).
### backend
Set up deploy from this GitHub repo or its fork.
### frontend
Backend serves frontend, no extra hosting needed.
### access
Create GOD_LIKE_ACCESS_TOKEN and READ_ONLY_ACCESS_TOKEN at Heroku Project -> Settings -> Config Vars.
Use uuid v4 values to initialise these env vars.
GOD_LIKE_ACCESS_TOKEN is a required role to start server and use frontend. Give it to root admins of the system.
READ_ONLY_ACCESS_TOKEN is optional. Give it to trusted spectators of the system, if there are any.