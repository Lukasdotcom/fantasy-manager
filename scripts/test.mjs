import { createConnection } from 'mysql'
const connection = createConnection({
    host     : process.env.MYSQL_HOST,
    user     : "root",
    password : process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DATABASE
})
connection.query("SELECT SUM(last_match) FROM players WHERE EXISTS (SELECT * FROM squad WHERE squad.playeruid=players.uid AND position!='bench' AND leagueID=? AND player=?)", ["580879", "lukas.aurelius2005@gmail.com"], function(error, result, field) {
    console.log()
})