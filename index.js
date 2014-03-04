var express = require('express');
var fs = require("fs");
var app = express();
var sqlite3 = require('sqlite3').verbose();

var dbName = "./db.sqlite3";

app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());

function getDbConn() {
    var db = new sqlite3.Database(dbName);
    return db;
}

(function () {
    var db = getDbConn();
    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS Players (playerId INTEGER PRIMARY KEY, playerName TEXT)");
        db.run("CREATE TABLE IF NOT EXISTS Matches (matchId INTEGER PRIMARY KEY, winnerId INTEGER, loserId INTEGER, time TEXT)");
        db.close();
    });
})();

app.get("/api/players", function (req, res) {
    var db = getDbConn();
    db.all("SELECT * FROM Players", function (err, rows) {
        res.json(200, {
          players: rows
        });
        db.close();
    });
});

app.post("/api/players", function (req, res) {
    var db = getDbConn();
    db.run("INSERT INTO Players VALUES (NULL, $name)", { $name: req.body.playerName }, function (err) {
        if (err === null) {
            res.json(200, {
                inserted: {
                    playerId: this.lastID,
                    playerName: req.body.playerName
                }
            });
        } else {
            res.json(500, {
                error: "Something happened :("
            });
        }
        db.close();
    });
});

app.delete("/api/players", function (req, res) {
    var db = getDbConn();
    db.run("DELETE FROM Players WHERE playerId = $playerId", {
        $playerId: req.body.playerId
    }, function (err, ress) {
        if(err === null) {
            res.send(200);            
        } else {
            res.send(500);
        }
        db.close();
    });
});

app.get("/api/matches", function (req, res) {
    var db = getDbConn();
    db.all("SELECT * FROM Matches", function (err, rows) {
        console.log(err);
        res.json(200, {
          matches: rows
        });
        db.close();
    });
});

app.post("/api/matches", function (req, res) {
    var db = getDbConn();
    console.log(req.body);
    db.run("INSERT INTO Matches VALUES (NULL, $winner, $loser, $time)", {
            $winner: req.body.winnerId,
            $loser: req.body.loserId,
            $time: req.body.time
        }, function (err) {
            console.log(err);
        if (err === null) {
            res.json(200, {
                inserted: {
                    matchId: this.lastID,
                    winnerId: req.body.winnerId,
                    loserId: req.body.loserId,
                    time: req.body.time
                }
            });
        } else {
            res.json(500, {
                error: "Something happened :("
            });
        }
        db.close();
    });
});

app.listen(3000);
console.log('Listening on port 3000');