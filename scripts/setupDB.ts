import connect from "#database";
export async function setupDB() {
  const connection = await connect();
  await Promise.all([
    // Used to store the users
    connection.query(
      "CREATE TABLE IF NOT EXISTS users (id int PRIMARY KEY AUTO_INCREMENT NOT NULL, username varchar(255), password varchar(60), throttle int DEFAULT 30, active bool DEFAULT 0, inactiveDays int DEFAULT 0, google varchar(255) DEFAULT '', github varchar(255) DEFAULT '', admin bool DEFAULT false, favoriteLeague int, theme varchar(10), locale varchar(5))",
    ),
    // Used to store the players data
    connection.query(
      "CREATE TABLE IF NOT EXISTS players (uid varchar(25), name varchar(255), nameAscii varchar(255), club varchar(3), pictureID int, value int, sale_price int, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int, locked bool, `exists` bool, league varchar(25))",
    ),
    // Creates a table that contains some key value pairs for data that is needed for some things
    connection.query(
      "CREATE TABLE IF NOT EXISTS data (value1 varchar(25) PRIMARY KEY, value2 varchar(255))",
    ),
    // Used to store the leagues settings
    connection.query(
      "CREATE TABLE IF NOT EXISTS leagueSettings (leagueName varchar(255), leagueID int PRIMARY KEY AUTO_INCREMENT NOT NULL, startMoney int DEFAULT 150000000, transfers int DEFAULT 6, duplicatePlayers int DEFAULT 1, starredPercentage int DEFAULT 150, league varchar(25), archived int DEFAULT 0, matchdayTransfers boolean DEFAULT 0, fantasyEnabled boolean DEFAULT 1, predictionsEnabled boolean DEFAULT 1, predictWinner int DEFAULT 2, predictDifference int DEFAULT 5, predictExact int DEFAULT 15, top11 boolean DEFAULT 0, active bool DEFAULT 0, inactiveDays int DEFAULT 0)",
    ),
    // Used to store the leagues users
    connection.query(
      "CREATE TABLE IF NOT EXISTS leagueUsers (leagueID int, user int, fantasyPoints int DEFAULT 0, predictionPoints int DEFAULT 0, points int, money int, formation varchar(255), admin bool DEFAULT 0, tutorial bool DEFAULT 1)",
    ),
    // Used to store the Historical Points
    connection.query(
      "CREATE TABLE IF NOT EXISTS points (leagueID int, user int, fantasyPoints int, predictionPoints int, points int, matchday int, money int, time int)",
    ),
    // Used to store transfers
    connection.query(
      "CREATE TABLE IF NOT EXISTS transfers (leagueID int, seller int, buyer int, playeruid varchar(25), value int, position varchar(5) DEFAULT 'bench', starred bool DEFAULT 0, max int, PRIMARY KEY (leagueID, seller, buyer, playeruid))",
    ),
    // Used to store invite links
    connection.query(
      "CREATE TABLE IF NOT EXISTS invite (inviteID varchar(25) PRIMARY KEY, leagueID int)",
    ),
    // Used to store player squads
    connection.query(
      "CREATE TABLE IF NOT EXISTS squad (leagueID int, user int, playeruid varchar(25), position varchar(5), starred bool DEFAULT 0)",
    ),
    // Used to store historical squads
    connection.query(
      "CREATE TABLE IF NOT EXISTS historicalSquad (matchday int, leagueID int, user int, playeruid varchar(25), position varchar(5), starred bool DEFAULT 0)",
    ),
    // Used to store historical player data
    connection.query(
      "CREATE TABLE IF NOT EXISTS historicalPlayers (time int, uid varchar(25), name varchar(255), nameAscii varchar(255), club varchar(3), pictureID int, value int, sale_price int, position varchar(3), forecast varchar(1), total_points int, average_points int, last_match int, `exists` bool, league varchar(25))",
    ),
    // Used to store historical transfer data
    connection.query(
      "CREATE TABLE IF NOT EXISTS historicalTransfers (matchday int, leagueID int, seller int, buyer int, playeruid varchar(25), value int)",
    ),
    // Used to store club data
    connection.query(
      "CREATE TABLE IF NOT EXISTS clubs (club varchar(25), fullName varchar(255), gameStart int, gameEnd int, opponent varchar(3), teamScore int, opponentScore int, league varchar(25), home bool, `exists` bool, PRIMARY KEY(club, league))",
    ),
    // Used to store club data
    connection.query(
      "CREATE TABLE IF NOT EXISTS historicalClubs (club varchar(25), fullName varchar(255), gameStart int, opponent varchar(3), teamScore int, opponentScore int, league varchar(25), home bool, time int, `exists` bool, PRIMARY KEY(club, league, time))",
    ),
    // Used to store future games
    connection.query(
      "CREATE TABLE IF NOT EXISTS futureClubs (club varchar(25), fullName varchar(255), gameStart int, opponent varchar(3), league varchar(25), home bool, PRIMARY KEY(club, league, gameStart))",
    ),
    // Used to store analytics data
    connection.query(
      "CREATE TABLE IF NOT EXISTS analytics (day int PRIMARY KEY, versionActive varchar(255), versionTotal varchar(255), leagueActive varchar(255), leagueTotal varchar(255), themeActive varchar(255), themeTotal varchar(255), localeActive varchar(255), localeTotal varchar(255))",
    ),
    // Used to store every server's analytics data
    connection.query(
      "CREATE TABLE IF NOT EXISTS detailedAnalytics (serverID varchar(255), day int, version varchar(255), active int, total int, leagueActive varchar(255), leagueTotal varchar(255), themeActive varchar(255), themeTotal varchar(255), localeActive varchar(255), localeTotal varchar(255))",
    ),
    // Used to store league announcements
    connection.query(
      "CREATE TABLE IF NOT EXISTS announcements (leagueID int, priority varchar(10) check(priority = 'error' or priority = 'info' or priority = 'success' or priority='warning'), title varchar(255), description varchar(255))",
    ),
    // Used to store plugin settings
    connection.query(
      "CREATE TABLE IF NOT EXISTS plugins (name varchar(255), settings varchar(255), enabled boolean, installed boolean, url varchar(255) PRIMARY KEY, version varchar(255))",
    ),
    // Used to store picture IDs
    connection.query(
      "CREATE TABLE IF NOT EXISTS pictures (id int PRIMARY KEY AUTO_INCREMENT NOT NULL, url varchar(255), downloading boolean DEFAULT 0, downloaded boolean DEFAULT 0, height int, width int)",
    ),
    // Used to store predictions
    connection.query(
      "CREATE TABLE IF NOT EXISTS predictions (leagueID int, user int, club varchar(255), league varchar(255), home int, away int, PRIMARY KEY(leagueID, user, club))",
    ),
    // Used to store historical predictions
    connection.query(
      "CREATE TABLE IF NOT EXISTS historicalPredictions (matchday int, leagueID int, user int, club varchar(255), league varchar(255), home int, away int)",
    ),
    // Used to store future predictions
    connection.query(
      "CREATE TABLE IF NOT EXISTS futurePredictions (leagueID int, user int, club varchar(255), league varchar(255), gameStart int, home int, away int, PRIMARY KEY (leagueID, user, club, gameStart))",
    ),
    // Enables the WAL
    connection.query("PRAGMA journal_mode=WAL"),
  ]);
  // Creates all the indexes for the database
  await Promise.all([
    await connection.query(
      "CREATE INDEX IF NOT EXISTS players_uid_league ON players(uid, league)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS leagueUsers_leagueID_user ON leagueUsers(leagueID, user)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS points_leagueID_user_matchday ON points(leagueID, user)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS transfers_leagueID ON transfers(leagueID)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS squad_leagueID_user ON squad(leagueID, user)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS historicalSquad_leagueID_user_matchday ON historicalSquad(leagueID, user, matchday)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS historicalPlayers_uid_time ON historicalPlayers(uid, time)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS historicalTransfers_leagueID_matchday ON historicalTransfers(leagueID, matchday)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS clubs_club_league ON historicalClubs(club, league)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS historicalClubs_club_league_time ON historicalClubs(club, league, time)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS detailedAnalytics_day ON detailedAnalytics(day)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS announcements_leagueID ON announcements(leagueID)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS pictures_url ON pictures(url)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS predictions_leagueID_user ON predictions(leagueID, user)",
    ),
    await connection.query(
      "CREATE INDEX IF NOT EXISTS historicalPredictions_leagueID_user_matchday ON historicalPredictions(leagueID, user, matchday)",
    ),
  ]);
  connection.end();
}
