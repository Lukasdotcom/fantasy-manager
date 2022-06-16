import { getSession } from 'next-auth/react'

export default async function handler(req, res) {
    const mysql = require('mysql')
    const session = await getSession({req})
    const league = req.query.league 
    if (!session) {
        res.status(401).end("Not logged in")
    } else {
        const user = session.user.id
        var connection = mysql.createConnection({
            host     : process.env.MYSQL_HOST,
            user     : process.env.MYSQL_USER,
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DATABASE
            })
        // Gets users money
        const money = await new Promise((resolve) => {
            connection.query("SELECT money FROM leagues WHERE leagueID=? and user=?", [league, user], function(error, results, fields) {
                resolve(results)
            })
        }).then((e) => e.length > 0 ? e[0].money : false)
        switch (req.method) {
            // Used to return a dictionary of all transfers and ownerships
            case "GET":
                if (money !== false) {
                    const [transfers, userSquad, squads, timeLeft] = await Promise.all([
                        // Gets list of all transfers
                        new Promise((resolve) => {
                            connection.query("SELECT * FROM transfers WHERE leagueID=?", [league], function(error, results, fields) {
                                resolve(results)
                            })
                        }),
                        // Gets users squad
                        new Promise((resolve) => {
                            connection.query("SELECT * FROM squad WHERE leagueID=? and user=?", [league, user], function(error, results, fields) {
                                resolve(results)
                            })
                        }),
                        // Gets all squads that are not the users
                        new Promise((resolve) => {
                            connection.query("SELECT * FROM squad WHERE leagueID=? and user!=?", [league, user], function(error, results, fields) {
                                resolve(results)
                            })
                        }),
                        // Gets the amount of time left in the transfer period
                        new Promise((res) => {
                            connection.query("SELECT value2 FROM data WHERE value1='transferOpen'", function(error, result, field) {
                                res(parseInt(result[0].value2))
                            })
                        })
                    ])
                    // Puts all the ownership and transfer info in a dictionary
                    let ownership = {}
                    let transferCount = 0
                    transfers.forEach(e => {
                        ownership[e.playeruid] = {"transfer" : {"value" : e.value, "buyer" : e.buyer, "buyerSelf" : e.buyer == user, "seller" : e.seller, "sellerSelf" : e.seller == user}}
                        if (e.seller == user || e.buyer == user) {
                            transferCount++
                        }
                    })
                    userSquad.forEach(e => {
                        if (ownership[e.playeruid] === undefined) {
                            ownership[e.playeruid] = {"userSquad" : true}
                        } else {
                            ownership[e.playeruid].userSquad = true
                        }
                    })
                    squads.forEach(e => {
                        if (ownership[e.playeruid] === undefined) {
                            ownership[e.playeruid] = {"otherSquad" : e.player}
                        } else {
                            ownership[e.playeruid].otherSquad = true
                        }
                    })
                    res.status(200).json({ownership: ownership, money: await money, transferCount, timeLeft})
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
                    // Checks if the transfer market is still open
                    connection.query("SELECT value2 FROM data WHERE value1='transferOpen'", function(error, result, field) {
                        if (result[0].value2 > 0) {
                            // Checks if the user still can transfer a player
                            connection.query("SELECT * FROM squad WHERE leagueID=? and user=?", [league, user], function(error, result, fields) {
                                if (result.length == 0) {
                                    resolve(true)
                                } else {
                                    connection.query("SELECT * FROM transfers WHERE leagueID=? and (buyer=? or seller=?)", [league, user, user], function(error, result, fields) {
                                        // Checks if this is past the limit of 6 players or if this is just an increase on a bid
                                        resolve(result.filter((e) => e.playeruid == playeruid).length < 6)
                                    })
                                }
                            })
                        } else {
                            resolve(false)
                        }
                        
                    })
                }).then(async (e) => {
                    return e ? await new Promise((resolve) => {
                        // Checks if it is a purchase or a sale
                        connection.query("SELECT * FROM squad WHERE leagueID=? and user=? and playeruid=?", [league, user, playeruid], function(error, result, fields) {
                            if (result.length > 0) {
                                // Checks if the player is already being sold
                                connection.query("SELECT * FROM transfers WHERE leagueID=? and playeruid=?", [league, playeruid], function(error, result, fields) {
                                    if (result.length == 0) {
                                        connection.query("INSERT INTO transfers VALUES(?, ?, 0, ?, ?)", [league, user, playeruid, value])
                                        connection.query("UPDATE leagues SET money=? WHERE leagueID=? and user=?", [money + value, league, user])
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
                                        // Checks if the user needs to overbid and checks if they have enough money
                                        if (result.length > 0) {
                                            purchaseAmount = result[0].value + 100000
                                            // Checks if the user is overbidding themselves
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
                                            // Checks if a user has the player otherwise it is bought from the AI
                                            if (value <= money ) {
                                                connection.query("SELECT * FROM squad WHERE leagueID=? and playeruid=?", [league, playeruid], function(error, result, fields) {
                                                    if (result.length == 0) {
                                                        connection.query("INSERT INTO transfers VALUES(?, 0, ?, ?, ?)", [league, user, playeruid, value])
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
                                        // Removes the money from the user after the purchase
                                        connection.query("UPDATE leagues SET money=money-? WHERE leagueID=? and user=?", [purchaseAmount, league, user])
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