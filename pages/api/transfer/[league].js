import { getSession } from 'next-auth/react'
// Promise to get the amount of money the player has


export default async function handler(req, res) {
    const mysql = require('mysql')
    const session = await getSession({req})
    const league = req.query.league 
    if (!session) {
        res.status(401).end("Not logged in")
    } else {
        const user = session.user.email
        var connection = mysql.createConnection({
            host     : process.env.MYSQL_HOST,
            user     : "root",
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DATABASE
            })
        // Gets players money
        const money = await new Promise((resolve) => {
            connection.query("SELECT money FROM leagues WHERE leagueID=? and player=?", [league, user], function(error, results, fields) {
                resolve(results)
            })
        }).then((e) => e.length > 0 ? e[0].money : false)
        switch (req.method) {
            // Used to return a dictionary of all transfers and ownerships
            case "GET":
                if (money !== false) {
                    // Gets list of all transfers
                    const transfers = await new Promise((resolve) => {
                        connection.query("SELECT * FROM transfers WHERE leagueID=?", [league], function(error, results, fields) {
                            resolve(results)
                        })
                    })
                    // Gets players squad
                    const playerSquad = await new Promise((resolve) => {
                        connection.query("SELECT * FROM squad WHERE leagueID=? and player=?", [league, user], function(error, results, fields) {
                            resolve(results)
                        })
                    })
                    // Gets all squads that are not the players
                    const squads = await new Promise((resolve) => {
                        connection.query("SELECT * FROM squad WHERE leagueID=? and player!=?", [league, user], function(error, results, fields) {
                            resolve(results)
                        })
                    })
                    // Puts all the ownership and transfer info in a dictionary
                    let ownership = {}
                    playerSquad.forEach(e => {ownership[e.playeruid] = {"playerSquad" : true}})
                    squads.forEach(e => {ownership[e.playeruid] = {"otherSquad" : e.player}})
                    transfers.forEach(e => {ownership[e.playeruid] = {"transfer" : {"value" : e.value, "buyer" : e.buyer, "buyerSelf" : e.buyer == user, "seller" : e.seller, "sellerSelf" : e.seller == user}}})
                    res.status(200).json({ownership: ownership, money: await money})
                } else {
                    res.status(404).end("League not found")
                }
                break;
            // Used to create a new transfer
            case "POST":
                const playeruid = req.body.playeruid
                // Gets the value of the player
                const value = await new Promise((resolve) => {
                    connection.query("SELECT * FROM players WHERE uid=?", [playeruid], function(error, result, fields) {
                        if (result.length > 0) {
                            resolve(result[0].value)
                        } else {
                            resolve(false)
                        }
                    })
                })
                // Promise that returns false if this transfer can not be done and sold when it is a sale and bought when it is a purchase
                const valid = await new Promise((resolve) => {
                    // Checks if the user still can transfer a player
                    connection.query("SELECT * FROM squad WHERE leagueID=? and player=?", [league, user], function(error, result, fields) {
                        if (result.length == 0) {
                            resolve(true)
                        } else {
                            connection.query("SELECT * FROM transfers WHERE leagueID=? and (buyer=? or seller=?)", [league, user, user], function(error, result, fields) {
                                resolve(result.length < 6)
                            })
                        }
                    })
                }).then(async (e) => {
                    return e ? await new Promise((resolve) => {
                        // Checks if it is a purchase or a sale
                        connection.query("SELECT * FROM squad WHERE leagueID=? and player=? and playeruid=?", [league, user, playeruid], function(error, result, fields) {
                            if (result.length > 0) {
                                // Checks if the player is already being sold
                                connection.query("SELECT * FROM transfers WHERE leagueID=? and playeruid=?", [league, playeruid], function(error, result, fields) {
                                    if (result.length == 0) {
                                        connection.query("INSERT INTO transfers VALUES(?, ?, '', ?, ?)", [league, user, playeruid, value])
                                        connection.query("UPDATE leagues SET money=? WHERE leagueID=? and player=?", [money + value, league, user])
                                    }
                                    resolve("sold")
                                })
                            } else {
                                if (value === false) {
                                    resolve("Player does not exist")
                                } else {
                                    // Checks if the player is already being sold
                                    connection.query("SELECT * FROM transfers WHERE leagueID=? and playeruid=?", [league, playeruid], async function(error, result, fields) {
                                        let purchaseAmount = value
                                        // Checks if the player needs to overbid and checks if they have enough money
                                        if (result.length > 0) {
                                            purchaseAmount = result[0].value + 100000
                                            // Checks if the player is overbidding themselves
                                            if (purchaseAmount <= money || (result[0].buyer == user && money >= 100000)) {
                                                connection.query("UPDATE transfers SET value=?, buyer=? WHERE leagueID=? and playeruid=?", [purchaseAmount, user, league, playeruid])
                                                connection.query("UPDATE leagues SET money=money+? WHERE leagueID=? and player=?", [result[0].value, league, result[0].buyer])
                                                connection.query("UPDATE leagues SET money=money+100000 WHERE leagueID=? and player=?", [league, result[0].seller])
                                                resolve("bought")
                                            } else {
                                                purchaseAmount = 0
                                                resolve("Not enough money")
                                            }
                                        } else {
                                            // Checks if a player has it otherwise it is bought from the AI
                                            if (value <= money ) {
                                                connection.query("SELECT * FROM squad WHERE leagueID=? and playeruid=?", [league, playeruid], function(error, result, fields) {
                                                    if (result.length == 0) {
                                                        connection.query("INSERT INTO transfers VALUES(?, '', ?, ?, ?)", [league, user, playeruid, value])
                                                        resolve("bought")
                                                    } else {
                                                        resolve("Not for sale")
                                                    }
                                                })
                                            } else {
                                                purchaseAmount = 0
                                                resolve("Not enough money")
                                            }
                                        }
                                        // Removes the money from the player after the purchase
                                        connection.query("UPDATE leagues SET money=money-? WHERE leagueID=? and player=?", [purchaseAmount, league, user])
                                    })
                                }
                            }
                        })
                    }) : e
                })
                if (valid === false) {
                    res.status(400).end("No transfers left")
                } else if (["bought", "sold"].includes(valid)) {
                    res.status(200).end(`Succesfully ${valid} player`)
                } else {
                    res.status(400).end(valid)
                }
                break;
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
                break;
        }
        connection.end()
    }
}