import { getSession } from 'next-auth/react'

// Used to change a users username
export default async function handler(req, res) {
    switch (req.method) {
        case "POST":
            const session = await getSession({req})
            const id = session.user.id
            if (! session) {
                res.status(401).end("Not logged in")
            } else if (req.body.password !== undefined) {
                // Updates the password if one is given.
                const mysql = require('mysql')
                const password = req.body.password
                const connection = mysql.createConnection({
                    host     : process.env.MYSQL_HOST,
                    user     : "root",
                    password : process.env.MYSQL_PASSWORD,
                    database : process.env.MYSQL_DATABASE
                    })
                const bcrypt = require('bcryptjs');
                connection.query("UPDATE users SET password=? WHERE id=?", [password === "" ? "" : bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS)), id])
                res.status(200).end("Changed password")
                connection.end()
            } else if (req.body.username === undefined) {
                res.status(500).end("No username given")
            } else {
                const mysql = require('mysql')
                const connection = mysql.createConnection({
                    host     : process.env.MYSQL_HOST,
                    user     : "root",
                    password : process.env.MYSQL_PASSWORD,
                    database : process.env.MYSQL_DATABASE
                    })
                connection.query("UPDATE users SET username=? WHERE id=?", [req.body.username, id])
                res.status(200).end("Changed username")
                connection.end()
            }
            break;
        default:
            res.status(405).end(`Method ${req.method} Not Allowed`)
            break;
    }
}