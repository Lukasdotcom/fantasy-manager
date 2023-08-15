# Enviromental Variables

## Change These

### NEXTAUTH_URL

This should be passed the url of the server

### NEXTAUTH_SECRET

This is used to encrypt the session token change this to the result of the following command:

```bash
openssl rand -base64 32
```

### SQLITE OR MYSQL

Depending on what kind of database you are using you need to either specify the SQLITE or MYSQL enviromental variable.

For sqlite you just specify the path of the database. SQLITE=/path/to/database.db

For mysql you need to specify the username, password, database name and host. MYSQL_USER=bundesliga MYSQL_PASSWORD=password MYSQL_DATABASE=bundesliga MYSQL_HOST=db.

## Other Variables

### OAUTH

This supports github and google for oauth.

- For google just pass in GOOGLE_ID and GOOGLE_SECRET as enviromental variables.
- For github just pass in GITHUB_ID and GITHUB_SECRET as enviromental variables.

### ADMIN

There is an admin user that can change what plugins are being run in the admin panel. To set this to a user just find out the user id and put it into the enviromental variable ADMIN. The usermenu will tell you your users user id.

### MIN_UPDATE_TIME

This is the number of seconds that need to pass before data is updated during matchdays. Default is 120.

### MIN_UPDATE_TIME_TRANSFER

This is the number of seconds that need to pass before data is updated during whenever it is not a matchday. Default is 3600.

### DOWNLOAD_PICTURE

This is the setting to decide if player pictures should be downloaded to disk. No means that they will never be downloaded to disk, needed means they will be downloaded when needed, and yes means they will be downloaded when a new picture is discovered. The default is needed. Note that yes should only temporarily be on otherwise all of the missing pictures will have a download attempted everytime you restart the server.

### BCRYPT_ROUNDS

This is the number of rounds to use for hashing passwords. Default is 9.

### ANALYTICS_OPT_OUT

You may opt out of analytics being sent to the analytics server by setting this to optout.
