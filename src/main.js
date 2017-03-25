var game;
var canPick;
var gameArray = [];
var swapSpeed = 200;
var destroySpeed = 500;
var fallSpeed = 500;
var tileGroup;
var selectedTile;
var score = 0;
var scoreText;
var removeMap;

var holes = [];

var gameOptions = {
	gameWidth: 640,
	gameHeight: 640,
	tileSize: 80,
	// gameWidth: 800,
	// gameHeight: 800,
	// tileSize: 100,
	fieldSize: {
		rows: 8,
	  cols: 8
	},
  colors: [0x3ac38d, 0x3997b3, 0xd93e44	, 0xffb752, 0x444444]
}

// var Phaser = require('./phaser');

var test = require('./test')

window.onload = function() {

	game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);

  game.state.add("TheGame", TheGame);

  game.state.start("TheGame");

}

var TheGame = function(game){}
TheGame.prototype = {
	preload: function(){
          game.load.image("tiles", "assets/sprites/tile.png");
	},
	create: function(){
          drawField();
          canPick = true;
          game.input.onDown.add(tileSelect);
					game.input.onUp.add(tileDeselect);
	}
}

// test.drawField();

// window.onload = test.initial();



function drawField(){

	tileGroup = game.add.group();
	scoreText = game.add.text(0, 0, 'score: 0', { fontSize: '32px', fill: '#fff' });
	for(var i = 0; i < gameOptions.fieldSize.rows; i ++){
		gameArray[i] = [];
		for(var j = 0; j < gameOptions.fieldSize.cols; j ++){
			var tile = game.add.sprite(gameOptions.tileSize * j + gameOptions.tileSize / 2,
                                 gameOptions.tileSize * i + gameOptions.tileSize / 2, "tiles");
        tile.anchor.set(0.5);
        tileGroup.add(tile);
				do{
					var randomColor = game.rnd.between(0, gameOptions.colors.length - 1);
					tile.tint = gameOptions.colors[randomColor];
					tile.scale.setTo(gameOptions.tileSize/100)
					gameArray[i][j] = {
						tileColor: randomColor,
						tileSprite: tile,
						x: j,
						y: i
					}
				} while(isMatch(i, j));
				// console.log(gameArray[i][j]);
			}
		}
		selectedTile = null;
}



function tileSelect(e){
	if(canPick){
		var row = Math.floor(e.clientY / gameOptions.tileSize);
		var col = Math.floor(e.clientX / gameOptions.tileSize);
    var pickedTile = gemAt(row, col)
		// console.log(pickedTile, gameOptions.colors.length);
    if(pickedTile != -1 && pickedTile.tileColor != gameOptions.colors.length - 1){
			if(selectedTile == null){
				pickedTile.tileSprite.scale.setTo(gameOptions.tileSize/100*1.1);
				pickedTile.tileSprite.bringToTop();
				selectedTile = pickedTile;
				game.input.addMoveCallback(tileMove);
			}
			else{
				if(areTheSame(pickedTile, selectedTile)){
					selectedTile.tileSprite.scale.setTo(gameOptions.tileSize/100);
          selectedTile = null;
				}
				else{
					if(areNext(pickedTile, selectedTile)){
						selectedTile.tileSprite.scale.setTo(gameOptions.tileSize/100);
						swapTiles(selectedTile, pickedTile, true);
					}
					else{
						selectedTile.tileSprite.scale.setTo(gameOptions.tileSize/100);
						pickedTile.tileSprite.scale.setTo(gameOptions.tileSize/100*1.1);
						selectedTile = pickedTile;
						game.input.addMoveCallback(tileMove);
					}
				}
			}
		}
	}
}

function tileMove(event, pX, pY){
	if(event.id == 0){
      var distX = pX - selectedTile.tileSprite.x;
      var distY = pY - selectedTile.tileSprite.y;
      var deltaRow = 0;
      var deltaCol = 0;
      if(Math.abs(distX) > gameOptions.tileSize / 2){
        if(distX > 0){
					deltaCol = 1;
				}
				else{
					deltaCol = -1;
				}
			}
			else{
				if(Math.abs(distY) > gameOptions.tileSize / 2){
					if(distY > 0){
						deltaRow = 1;
					}
					else{
						deltaRow = -1;
					}
				}
			}
			if(deltaRow + deltaCol != 0){
				var pickedTile = gemAt(getTileRow(selectedTile) + deltaRow, getTileCol(selectedTile) + deltaCol);
				if(pickedTile != -1){
					selectedTile.tileSprite.scale.setTo(gameOptions.tileSize/100)
					swapTiles(selectedTile, pickedTile, true);
					game.input.deleteMoveCallback(tileMove);
				}
			}
		}
}

function tileDeselect(e){
  game.input.deleteMoveCallback(tileMove);
}

function swapTiles(tile1, tile2, swapBack){
	if(tile2.tileColor != gameOptions.colors.length - 1) {
	canPick = false;
  var fromColor = tile1.tileColor;
  var fromSprite = tile1.tileSprite;
  var toColor = tile2.tileColor;
  var toSprite = tile2.tileSprite;
  gameArray[getTileRow(tile1)][getTileCol(tile1)].tileColor = toColor;
  gameArray[getTileRow(tile1)][getTileCol(tile1)].tileSprite = toSprite;
  gameArray[getTileRow(tile2)][getTileCol(tile2)].tileColor = fromColor;
  gameArray[getTileRow(tile2)][getTileCol(tile2)].tileSprite = fromSprite;
  var tile1Tween = game.add.tween(gameArray[getTileRow(tile1)][getTileCol(tile1)].tileSprite).to({
		x: getTileCol(tile1) * gameOptions.tileSize + gameOptions.tileSize / 2,
    y: getTileRow(tile1) * gameOptions.tileSize + gameOptions.tileSize / 2
	}, swapSpeed, Phaser.Easing.Linear.None, true);
	var tile2Tween = game.add.tween(gameArray[getTileRow(tile2)][getTileCol(tile2)].tileSprite).to({
		x: getTileCol(tile2) * gameOptions.tileSize + gameOptions.tileSize / 2,
    y: getTileRow(tile2) * gameOptions.tileSize + gameOptions.tileSize / 2
	}, swapSpeed, Phaser.Easing.Linear.None, true);
	tile2Tween.onComplete.add(function(){
		if(!matchInBoard() && swapBack){
			swapTiles(tile1, tile2, false);
		}
		else{
			if(matchInBoard()){
				handleMatches();
			}
			else{
				canPick = true;
        selectedTile = null;
			}
		}
	});
}
}

function isHorizontalMatch(row, col){
  return gemAt(row, col).tileColor == gemAt(row, col - 1).tileColor && gemAt(row, col).tileColor == gemAt(row, col - 2).tileColor;
}

function isVerticalMatch(row, col){
  return gemAt(row, col).tileColor == gemAt(row - 1, col).tileColor && gemAt(row, col).tileColor == gemAt(row - 2, col).tileColor;
}

function isMatch(row, col){
  return isHorizontalMatch(row, col) || isVerticalMatch(row, col);
}

function gemAt(row, col){
  if(row < 0 || row >= gameOptions.fieldSize.rows || col < 0 || col >= gameOptions.fieldSize.cols){
		return -1;
  }
  return gameArray[row][col];
}

function areTheSame(tile1, tile2){
  return getTileRow(tile1) == getTileRow(tile2) && getTileCol(tile1) == getTileCol(tile2);
}

function areNext(tile1, tile2){
  return Math.abs(getTileRow(tile1) - getTileRow(tile2)) + Math.abs(getTileCol(tile1) - getTileCol(tile2)) == 1;
}

function getTileRow(tile){
  return Math.floor(tile.tileSprite.y / gameOptions.tileSize);
}

function getTileCol(tile){
  return Math.floor(tile.tileSprite.x / gameOptions.tileSize);
}

function matchInBoard(){
  for(var i = 0; i < gameOptions.fieldSize.rows; i++){
    for(var j = 0; j < gameOptions.fieldSize.cols; j++){
      if(isMatch(i, j)){
				return true;
			}
		}
  }
  return false;
}

function handleMatches(){
  removeMap = [];
  for(var i = 0; i < gameOptions.fieldSize.rows; i++){
		removeMap[i] = [];
    for(var j = 0; j < gameOptions.fieldSize.cols; j++){
			removeMap[i].push(0);
		}
	}
	// console.log(removeMap);
	VerticalMatches();
  HorizontalMatches();
  destroyTiles();
}

function HorizontalMatches(){
	for(var i = 0; i < gameOptions.fieldSize.rows; i++){
		var colorStreak = 1;
		var currentColor = -1;
		var startStreak = 0;
    for(var j = 0; j < gameOptions.fieldSize.cols; j++){
			if(gemAt(i, j).tileColor == currentColor){
				colorStreak ++;
			}
			if(gemAt(i, j).tileColor != currentColor || j == gameOptions.fieldSize.cols - 1){
				if(colorStreak >= 3){
					scoreCount(colorStreak)
					for(var k = 0; k < colorStreak; k++){
						removeMap[i][startStreak + k] ++;
					}
				}
				startStreak = j;
				colorStreak = 1;
				currentColor = gemAt(i, j).tileColor;
			}
		}
  }
}

function VerticalMatches(){
  for(var i = 0; i < gameOptions.fieldSize.rows; i++){
    var colorStreak = 1;
    var currentColor = -1;
    var startStreak = 0;
    for(var j = 0; j < gameOptions.fieldSize.cols; j++){
			if(gemAt(j, i).tileColor == currentColor){
				colorStreak ++;
			}
			if(gemAt(j, i).tileColor != currentColor || j == gameOptions.fieldSize.cols - 1){
				if(colorStreak >= 3){
					scoreCount(colorStreak)
					for(var k = 0; k < colorStreak; k++){
						removeMap[startStreak + k][i] ++;
					}
				}
				startStreak = j;
        colorStreak = 1;
        currentColor = gemAt(j, i).tileColor;
			}
		}
  }
}

function destroyTiles(){
	var destroyed = 0;
	for(var i = 0; i < gameOptions.fieldSize.rows; i++){
		for(var j = 0; j < gameOptions.fieldSize.cols; j++){
			if(removeMap[i][j]>0){
				var destroyTween = game.add.tween(gameArray[i][j].tileSprite).to({
					alpha: 0
				}, destroySpeed, Phaser.Easing.Linear.None, true);
				destroyed ++;
				destroyTween.onComplete.add(function(tile){
					tile.destroy();
					destroyed --;
					if(destroyed == 0){
						TilesFall();
						replenishField();
					}
				});
				// console.log(gameArray[i][j].x, gameArray[i][j].y);
				// for(var k = 0; )
				// holes
				gameArray[i][j] = null;
				scoreText.text = 'score: ' + score;
			}
		}
  }
}

function TilesFall(){
	var fallen = 0;
  var restart = false;
  for(var i = gameOptions.fieldSize.rows - 2; i >= 0; i--){
		for(var j = 0; j < gameOptions.fieldSize.cols; j++){
			// console.log(gameArray[i][j]);
			if(gameArray[i][j] != null){
				if(gameArray[i][j].tileColor == gameOptions.colors.length - 1) {
					console.log(true);
				}
				var fallTiles = holesBelow(i, j);
				if(fallTiles > 0){
					// console.log(fallTiles);
					var tile2Tween = game.add.tween(gameArray[i][j].tileSprite).to({
						y: gameArray[i][j].tileSprite.y + fallTiles * gameOptions.tileSize
					}, fallSpeed*fallTiles, Phaser.Easing.Linear.None, true);
					fallen ++;
					tile2Tween.onComplete.add(function(){
						fallen --;
						if(fallen == 0){
							if(restart){
								TilesFall();
							}
						}
					})
					gameArray[i + fallTiles][j] = {
						tileSprite: gameArray[i][j].tileSprite,
						tileColor: gameArray[i][j].tileColor
					}
					gameArray[i][j] = null;
				}
			}
		}
	}
	if(fallen == 0){
		replenishField();
	}
}

// gameArray[i][j].tileColor != gameOptions.colors.length - 1



function holesBelow(row, col){
	var result = 0;
	for(var i = row + 1; i < gameOptions.fieldSize.rows; i++){
		// console.log(gameArray[i][col].x);
		if(gameArray[i][col] == null){
			// hole = gameArray[i][col];
			// for(var j = hole.y - 1; j >= 0; j--) {
			// 	if(gameArray[j][col].tileColor == gameOptions.colors.length - 1) {
			// 		result ++;
			// 	}
			// }
			result ++;
		}
	}
  return result;
}

function replenishField(){
  var replenished = 0;
  var restart = false;
  for(var j = 0; j < gameOptions.fieldSize.cols; j++){
		var emptySpots = holesInCol(j);
		if(emptySpots > 0){
			for(i = 0; i < emptySpots; i++){
				var tile = game.add.sprite(gameOptions.tileSize * j + gameOptions.tileSize / 2, -
											            (gameOptions.tileSize * (emptySpots - 1 - i) + gameOptions.tileSize / 2), "tiles");
				tile.anchor.set(0.5);
				tileGroup.add(tile);
				var randomColor = game.rnd.between(0, gameOptions.colors.length - 2);
				tile.tint = gameOptions.colors[randomColor];
				tile.scale.setTo(gameOptions.tileSize/100)
				gameArray[i][j] = {
					tileColor: randomColor,
          tileSprite: tile
				}
				var tile2Tween = game.add.tween(gameArray[i][j].tileSprite).to({
					y: gameOptions.tileSize * i + gameOptions.tileSize / 2
				}, fallSpeed*emptySpots, Phaser.Easing.Linear.None, true);
				replenished ++;
				tile2Tween.onComplete.add(function(){
					replenished --;
					for(k = 0; k < gameOptions.fieldSize.rows; k++) {
						for(l = 0; l < gameOptions.fieldSize.cols; l++) {
							console.log(gameArray[k][l]);
							if(gameArray[k][l] == null) {
								var tile2Tween2 = game.add.tween(gameArray[k-1][l].tileSprite).to({
									y: gameOptions.tileSize * (k - 1) + gameOptions.tileSize / 2
								}, fallSpeed*emptySpots, Phaser.Easing.Linear.None, true);
								// gameArray[k][l-1]
							}
						}
					}
					if(replenished == 0){
						if(restart){
							TilesFall();
						}
						else{
							if(matchInBoard()){
								game.time.events.add(250, handleMatches);
							}
							else{
								canPick = true;
								selectedTile = null;
							}
						}
					}
				})
			}
		}
	}
}

function holesInCol(col){
  var result = 0;
  for(var i = 0; i < gameOptions.fieldSize.cols; i++){
		if(gameArray[i][col] == null){
			result ++;
		}
	}
	return result;
}

function scoreCount(streak) {
	score += streak*50
}

module.exports.game = game;
