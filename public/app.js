"use strict";
///<reference path="~/public/vendor/knockout.debug.js"/>
///<reference path="~/public/vendor/jquery.js"/>

function dataAccess() {
    var getAllPlayers = function(callback) {
        $.ajax("/api/players", {
            type: "GET",
            contentType: "application/json",
            success: function(result) {
                var players = [];
                for (var i = 0; i < result.players.length; i++) {
                    var p = result.players[i];
                    players.push({
                        playerName: p.playerName,
                        playerId: p.playerId
                    });
                }
                callback(players);
            }
        });
    };

    var savePlayer = function(playerName, callback) {
        $.ajax("/api/players", {
            data: ko.toJSON({
                playerName: playerName
            }),
            type: "POST",
            contentType: "application/json",
            success: function(result) {
                callback({
                    playerId: result.inserted.playerId,
                    playerName: playerName
                });
            }
        });
    };

    var deletePlayer = function(playerId, callback) {
        $.ajax("/api/players", {
            data: ko.toJSON({
                playerId: playerId
            }),
            type: "DELETE",
            contentType: "application/json",
            success: function() {
                callback();
            }
        });
    };

    var getAllMatches = function(callback) {
        $.ajax("/api/matches", {
            type: "GET",
            contentType: "application/json",
            success: function(result) {
                var matches = [];
                for (var i = 0; i < result.matches.length; i++) {
                    var p = result.matches[i];
                    matches.push({
                        matchId: p.matchId,
                        winnerId: p.winnerId,
                        loserId: p.loserId,
                        time: p.time,
                    });
                }
                callback(matches);
            }
        });
    };

    var saveMatch = function(winnerId, loserId, callback) {
        $.ajax("/api/matches", {
            data: ko.toJSON({
                winnerId: winnerId,
                loserId: loserId,
                time: new Date().toTimeString()
            }),
            type: "POST",
            contentType: "application/json",
            success: function(result) {
                callback({
                    playerId: result.inserted.matchId,
                    winnerId: result.inserted.winnerId,
                    loserId: result.inserted.loserId,
                    time: result.inserted.time,
                });
            }
        });
    };

    return {
        getAllPlayers: getAllPlayers,
        savePlayer: savePlayer,
        deletePlayer: deletePlayer,
        getAllMatches: getAllMatches,
        saveMatch: saveMatch
    };
}

function PoolPartyViewModel() {
    var self = this;
    self.dal = dataAccess();
    
    self.tabs = [
        {
            id: "allPlayers",
            text: "All Players"
        },
        {
            id: "allMatches",
            text: "All Matches"
        },
        {
            id: "selectedPlayerStats",
            text: "Selected Player Stats"
        }];

    self.newPlayerName = ko.observable();
    self.players = ko.observableArray([]);
    self.matches = ko.observableArray([]);
    self.selectedWinner = ko.observable();
    self.selectedLoser = ko.observable();
    self.chosenTabId = ko.observable(self.tabs[0].id);

    self.goToTab = function(tab) {
        self.chosenTabId(tab.id);
    };

    self.dal.getAllPlayers(function(players) {
        for (var i = 0; i < players.length; i++) {
            self.players.push(players[i]);
        }
        self.selectedWinner(self.players[0]);
        self.selectedLoser(self.players[1]);
    });
    
    self.dal.getAllMatches(function(matches) {
        for (var i = 0; i < matches.length; i++) {
            self.matches.push(matches[i]);
        }
    });

    self.selectedPlayer = ko.observable();

    self.setSelectedPlayer = function(player) {

        var timesWon = function() {
            var result = 0;
            for (var i = 0; i < self.matches().length; i++) {
                var m = self.matches()[i];
                if (m.winnerId == player.playerId) {
                    result++;
                }
            }
            return result;
        };
        
        var timesPlayed = function() {
            var result = 0;
            for (var i = 0; i < self.matches().length; i++) {
                var m = self.matches()[i];
                if (m.winnerId == player.playerId || m.loserId == player.playerId) {
                    result++;
                }
            }
            return result;
        };

        var selectedPlayerModel = {
            playerId: player.playerId,
            playerName: player.playerName,
            playersWonAgainst: ko.computed(function() {
                var losers = [];
                for (var i = 0; i < this.matches().length; i++) {
                    var m = this.matches()[i];
                    if(m.winnerId == player.playerId && losers.indexOf(m.loserId) === -1) {
                        losers.push(m.loserId);
                    }
                }
                return losers;
            }, self),
            playersLostAgainst: ko.computed(function() {
                var winners = [];
                for (var i = 0; i < this.matches().length; i++) {
                    var m = this.matches()[i];
                    if(m.loserId == player.playerId && winners.indexOf(m.winnerId) === -1) {
                        winners.push(m.winnerId);
                    }
                }
                return winners;
            }, self),
            title: ko.computed(function () {
                var totalMatches = timesPlayed();
                if(totalMatches === 0) {
                    return player.playerName + " is untested!";
                }
                var wins = timesWon();
                var winPercentage = (wins / totalMatches * 100).toFixed(2);
                return player.playerName + " has won " + wins + " matches out of " + totalMatches + " (" + winPercentage + "%)";
            }, self)
        };
        self.selectedPlayer(selectedPlayerModel);
    };

    self.getSelectedPlayerId = function() {
        if(self.selectedPlayer()) {
            return self.selectedPlayer().playerId;
        }
        return null;
    };

    self.currentPanel = ko.observable("allMatches");

    self.getWinsForPlayer = function(player) {
        var wins = 0;
        for (var i = 0; i < self.matches().length; i++) {
            if(self.matches()[i].winnerId === player.playerId) {
                wins++;
            }
        }
        return wins;
    };
    
    self.getLossesForPlayer = function(player) {
        var losses = 0;
        for (var i = 0; i < self.matches().length; i++) {
            if(self.matches()[i].loserId === player.playerId) {
                losses++;
            }
        }
        return losses;
    };

    self.getPlayerNameById = function(playerId) {
        for (var i = 0; i < self.players().length; i++) {
            if(self.players()[i].playerId === playerId) {
                return self.players()[i].playerName;
            }
        }
        return "UNKNOWN PLAYER";
    };

    self.savePlayer = function () {
        if(self.newPlayerName().length === 0) {
            return;
        }
        self.dal.savePlayer(self.newPlayerName(), function(player) {
            self.players.push(player);
            self.newPlayerName("");
        });
    };

    self.deletePlayer = function (player) {
        self.dal.deletePlayer(player.playerId, function() {
            self.players.destroyAll(player);
        });
    };

    self.recordVictory = function () {
        if(self.selectedWinner().playerId === self.selectedLoser().playerId) {
            alert("You can't play against yourself.");
            return;
        }
        self.dal.saveMatch(self.selectedWinner().playerId, self.selectedLoser().playerId, function(match) {
            self.matches.push(match);
        });
    };
}

ko.applyBindings(new PoolPartyViewModel());
