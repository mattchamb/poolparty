
function PoolPartyViewModel() {
    var self = this;

    self.newPlayerName = ko.observable();
    self.players = ko.observableArray([]);

    $.ajax("/api/players", {
        type: "GET", contentType: "application/json",
        success: function (result) {    
            for (var i = 0; i < result.players.length; i++) {
                var p = result.players[i];
                self.players.push({
                    playerName: p.playerName,
                    playerId: p.playerId
                });
            }
        }
    });

    self.savePlayer = function () {
        $.ajax("/api/players", {
            data: ko.toJSON({
                playerName: self.newPlayerName()
            }),
            type: "POST", contentType: "application/json",
            success: function (result) {
                self.players.push({
                    playerId: result.playerId,
                    playerName: self.newPlayerName()
                });
            }
        });
    };

    self.deletePlayer = function (player) {
        $.ajax("/api/players", {
            data: ko.toJSON({
                playerId: player.playerId
            }),
            type: "DELETE", contentType: "application/json",
            success: function (result) {
                self.players.destroy(player);
            }
        });
    };

    self.recordVictory = function (asdf) {

    };
}



ko.applyBindings(new PoolPartyViewModel());
