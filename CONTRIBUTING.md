# Typescript

I am very slowly converting this project to typescript. If you create a new file make it typescript and if you want to you can convert js files to typescript.

# Todos before making a pull request

- [ ] Run `npm run format` to format everything with prettier.
- [ ] Run `npm run lint` and fix all errors and new warnings.
- [ ] Made sure that all database changes have update code in entrypoint.ts.
- [ ] Made sure to test your changes whith [cypress](#cypress) by running `npm test` and when it is done stopping the server with ctr-c. If this fails and you don't know why look in the [cypress section](#cypress).
- [ ] If you added any features it would be great if you tested them with cypress(Not required).
- [ ] If you added another league did you follow all the steps in the [leagues.md How to add another league](../leagues.md#how-to-add-another-league).

# How to run development enviroment

There are 2 ways to run the development enviroment [Native](#native) and [Docker](#docker).

## Other Notes

- All sql syntax is written for mysql and is translated by the database module to sqlite syntax when needed.

## Native

**This is the reccommended way.**

1. If you want to use the recommended and easier way and use sqlite skip to step 8.
2. First [install mysql](https://dev.mysql.com/downloads/mysql).
3. When you are installing it will ask for the root user password. Enter whatever you want just remember the password.
4. When you are done installing open a terminal and type the following `mysql -u "root" -p` then press enter.
5. Now it will ask for a password enter the password you had entered in step 2.
6. Now Paste in the following lines(These will create the database and manage it)

```sql
CREATE DATABASE bundesliga;
CREATE USER 'bundesliga'@localhost IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON bundesliga.* TO 'bundesliga'@localhost;
FLUSH PRIVILEGES;
```

7. Now you can press control+D to exit.
8. Download this entire repository to your computer with

```bash
git clone https://github.com/lukasdotcom/fantasy-manager
```

9. [Install node v18 or greater](https://nodejs.org/en/) if you have not yet. To check you version run the command below which should give you some version number just make sure the major version is greater than or equal to 18

```bash
node -v
```

10. Now copy the contents of .env.sample which is in the development folder. Make a new file in the top folder in the repository called .env.local and paste the contents of .env.sample in there.
11. If you are using mysql remember to comment out the SQLITE enviroment variable otherwise skip this step.
12. Now you should be able to run the command below to start up the development instance.

```bash
npm run dev
```

## Docker

1. First install docker and docker-compose or docker desktop
2. Download this entire repository to your computer with

```bash
git clone https://github.com/lukasdotcom/fantasy-manager
```

3. Copy the docker-compose file in the development folder to the top folder of the repository.
4. Edit the volume and replace /locationToWhereThisGithubIsDownloaded with wherever this repository got downloaded to.
5. Then run `docker-compose up`

# Cypress

## FAQs

- Q: Why is the cypress test failing?
- A: If you made any major UI changes it may cause the test to fail. You may have to change the tests slightly(For help with making tests go to [How to Make Tests](#how-to-make-tests)). Otherwise there should be a video and a picture in the cypress/videos or cypress/screenshots directories.
- Q: Where are the types for the database?
- A: There is an interface for every table in the database located in the same file as the database connector.

## How to Make Tests

1. First run `npm run start:test` to start a testing server.
2. Secondly run `npm run cypress:open` to open cypress itself.
3. The tests will be located in the cypress/e2e folder.
4. If you want to load custom data into the db on the player values and points put the data into the sample folder and load it like shown in the invite2.js file in the cypress/e2e direcotory.
