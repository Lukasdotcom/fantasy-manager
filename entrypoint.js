const mysql = require("mysql")
const connection = mysql.createConnection({
    host     : process.env.MYSQL_HOST,
    user     : "root",
    password : process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DATABASE
})