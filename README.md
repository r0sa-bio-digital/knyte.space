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
Installed add-on Heroku Postgres to the target app.
Initialisation of the db will be described later...
### backend
Set up deploy from this GitHub repo or its fork.
### frontend
Backend serves frontend, no extra hosting needed.
### access
Create GOD_LIKE_ACCESS_TOKEN and READ_ONLY_ACCESS_TOKEN at Heroku Project -> Settings -> Config Vars.
Use uuid v4 values to initialise these env vars.
Give GOD_LIKE_ACCESS_TOKEN to root admins of the system.
Give READ_ONLY_ACCESS_TOKEN to trusted spectators of the system.