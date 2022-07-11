# Todos before making a pull request

- [ ] Run `npm run format` to format everything with prettier.
- [ ] Run `npm run lint` and fix all errors and warnings.
- [ ] Made sure that all database changes have update code in entrypoint.mjs.
- [ ] Made sure to test your changes.

# How to run development enviroment

There are 2 ways to run the development enviroment Native and Docker.

## Native

**This is the reccommended way.**

1. First [install mysql](https://dev.mysql.com/downloads/mysql).
2. When you are installing it will ask for the root user password. Enter whatever you want just remember the password.
3. When you are done installing open a terminal and type the following `mysql -u "root" -p` then press enter.
4. Now it will ask for a password enter the password you had entered in step 2.
5. Now Paste in the following lines(These will create the database and manage it)

```sql
CREATE DATABASE bundesliga;
CREATE USER 'bundesliga'@localhost IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON bundesliga.* TO 'bundesliga'@localhost;
FLUSH PRIVILEGES;
```

6. Now you can press control+D to exit.
7. Download this entire repository to your computer with

```bash
git clone https://github.com/lukasdotcom/Bundesliga
```

8. [Install node v18 or greater](https://nodejs.org/en/) if you have not yet. To check you version run the command below which should give you some version number just make sure the major version is greater than or equal to 18

```bash
node -v
```

9. Now copy the contents of .env.sample which is in the development folder. Make a new file in the top folder in the repository called .env.local and paste the contents of .env.sample in there.
10. Now follow the steps to get the BUNDESLIGA_API outlined in the README and enter that value in the the .env.local file.
11. Now you should be able to run the command below to start up the development instance.

```bash
npm run dev
```

## Docker

1. First install docker and docker-compose or docker desktop
2. Download this entire repository to your computer with

```bash
git clone https://github.com/lukasdotcom/Bundesliga
```

3. Copy the docker-compose file in the development folder to the top folder of the repository.
4. Edit the BUNDESLIGA_API entry by getting the value as shown in the README
5. Edit the volume and replace /locationToWhereThisGithubIsDownloaded with wherever this repository got downloaded to.
6. Then run `docker-compose up`
