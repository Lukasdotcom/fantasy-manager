# Enviromental Variables

## Change These

### NEXTAUTH_URL

This should be passed the url of the server

### NEXTAUTH_SECRET

This is used to encrypt the session token change this to the result of the following command:

```bash
openssl rand -base64 32
```

### SQLITE

To use the sqlite database you just specify the path of the database. SQLITE=/path/to/database.db

## Other Variables

### OAUTH

This supports github and google for oauth.

- For google just pass in GOOGLE_ID and GOOGLE_SECRET as enviromental variables.
- For github just pass in GITHUB_ID and GITHUB_SECRET as enviromental variables.

### ADMIN

There is an admin user that can change what plugins are being run in the admin panel. To set this to a user just find out the user id and put it into the enviromental variable ADMIN. The usermenu will tell you your users user id.

### BCRYPT_ROUNDS

This is the number of rounds to use for hashing passwords. Default is 9.

### ANALYTICS_OPT_OUT

You may opt out of analytics being sent to the analytics server by setting this to optout.
