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

## infrastructure overview
Entire project made to be hosted in a single Heroku app.
### db
DB hosting uses Heroku Postgres add-on.
### backend
Server hosting uses Heroku Node app deployed from GitHub repo.
### frontend
Backend hosted in Heroku serves frontend, no extra hosting needed.
### access
Basic access rules are defined in Heroku Project -> Settings -> Config Vars.
GOD_LIKE_ACCESS_TOKEN is a root admins of the system.
READ_ONLY_ACCESS_TOKEN is a trusted spectators of the system.

## running your own knyte.space instance
1. Make your own fork of this repo.
1. Make new Heroku app and set its ${App_Name}.
1. Install Heroku Postgres add-on to the app.
1. Restore Postgres DB from latest dump:
    1. Connect to DB via Table Plus
        1. Copy DATABASE_URL from Heroku Project -> Settings -> Config Vars
        1. Paste DATABASE_URL to Table Plus -> Create a new connection... -> Import from URL
        1. Set connection name related to ${App_Name}
        1. Press connect button to open DB
    1. Check it is empty
    1. Install Heroku Console locally
    1. Login to Heroku Console from the same account that contains Heroku app
    1. Take ${Dump_URL} of latest DB dump file from "db dumps" folder in the repo
    1. Follow [restoring backups instruction](https://devcenter.heroku.com/articles/heroku-postgres-backups#restoring-backups)
        1. Run command for DB restore
            1. heroku pg:backups:restore '${Dump_URL}' DATABASE_URL -a ${App_Name}
    1. Check that DB was restored correctly by pressing cmd+R in Table Plus.
1. Set knytes.imported = true for all restored rows:
    1. Select knytes table
    1. Press cmd+Enter to open sql query for the table
    1. Type command:
        1. UPDATE knytes SET imported = TRUE
    1. Press cmd+Enter to run the command
    1. Go to knytes table, press cmd+R and check that all imported = true for all rows
1. Setup env variables
    1. Heroku Project -> Settings -> Config Vars
        1. Create GOD_LIKE_ACCESS_TOKEN with random uuid v4 value (required)
            1. Give it to root admins of the system.
        1. Create READ_ONLY_ACCESS_TOKEN with random uuid v4 value (optional)
            1. Give it to trusted spectators of the system, if there are any.
1. Setup Node app deploy from your own GitHub repo
    1. Heroku Project -> Deploy -> Deployment method
        1. Connect
        1. Enable Automatic Deploys
        1. Manual deploy -> Deploy Branch
1. Heroku Project -> Open app
    1. Check it works.