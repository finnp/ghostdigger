window.onload = function () {
  var canvas = document.createElement('canvas') // <canvas id="game"></canvas>
  canvas.id = 'game'

  canvas.width = 800
  canvas.height = 640

  var game = new Game(canvas.width, canvas.height)
  document.body.appendChild(canvas)
  if(typeof canvas == 'string') canvas = getElementById(canvas.id) // in case browser returns string
  var context = canvas.getContext('2d')

  // y
  // |
  // |
  // |
  // |
  // V
  //  ----------> x
  var player = new Player(game)
  var controller = new Controller(player)
  var enemy = new Enemy(game)

  game.tiles[10][10].destroy()
  game.tiles[11][10].destroy()
  game.tiles[12][10].destroy()
  game.tiles[13 ][10].destroy()

  preload(startGame)

  function startGame(images) {
    player.sprite = images.player
    enemy.sprite = images.ghost
    console.log('startGame')
    requestAnimationFrame(draw)
    function draw(timestamp) {
      player.update()
      enemy.update()

      for(var i = 0; i < game.tilesY; i++) {
        for(var j = 0; j < game.tilesX; j++) {
            var tileSprite
            var tile = game.tiles[i][j]
            if(tile.isWall) {
              if(tile.discovered) {
                if(tile.gold > 0) {
                  tileSprite = images.gold
                } else {
                  tileSprite = images.wall
                }
              } else {
                tileSprite = images.fog
              }
            } else {
              tileSprite = images.floor
            }

            context.drawImage(tileSprite,
              Math.floor(game.offsetX * j),
              Math.floor(game.offsetY * i),
              Math.floor(game.offsetX),
              Math.floor(game.offsetY)
            )
         }
      }

      // draw player
      player.render(context)

      enemy.render(context)

      // display

      context.fillStyle = 'yellow'
      context.font = 'bold 16px Arial'
      context.fillText(player.gold + ' gold', game.width - 70, game.height - 20)

      // end
      requestAnimationFrame(draw)

    }
  }

  function preload(cb) {
    var images =  {
     floor: 'img/floor.png',
     wall: 'img/wall.png',
     player: 'img/player.png',
     fog: 'img/fog.png',
     gold: 'img/gold.png',
     ghost: 'img/ghost.png'
    }
    var loadedImages = {}
    var n = Object.keys(images).length

    for(imageName in images) {
      var img = new Image()
      img.onload = imageLoaded
      img.src = images[imageName]
      loadedImages[imageName] = img
    }

    function imageLoaded() {
      n--
      if(n === 0) cb(loadedImages)
    }
  }
}

//------CLASSES------//

//GAME
function Game(width, height) {
  var tiles = []
  var tilesX = 50
  var tilesY = 40
  for(var i = 0; i < tilesY; i++) {
    tiles[i] = []
    for(var j = 0; j < tilesX; j++) {
      tiles[i][j] = new Tile(tiles, j, i)
    }
  }


  this.width = width
  this.height = height

  this.offsetX = this.width / tiles[0].length
  this.offsetY = this.height / tiles.length

  this.tilesX = tilesX
  this.tilesY = tilesY

  this.tiles = tiles
}

Game.prototype.getTile = function(x, y) {
  return this.tiles[Math.floor(y / this.offsetY)][Math.floor(x / this.offsetX)]
}

// CHARACTER

function Character(game) {
  this.game = game
}

Character.prototype.render = function (context) {
  context.save()
  context.translate(this.pos.x * this.width, this.pos.y * this.height)
  context.translate(this.width / 2, this.height / 2)
  context.rotate(this.angle())
  context.drawImage(this.sprite,
    -this.width / 2, -this.height / 2, this.width, this.height
  )
  context.restore()
}

Character.prototype.angle = function () {
  var angle = 0
  if(this.direction.x === 1) angle = Math.PI / 2
  else if(this.direction.x === -1) angle = 3 * Math.PI / 2
  else if(this.direction.y === 1) angle = 2 * Math.PI / 2
        // else if(this.direction.y === -1) angle = 0
  return angle
}

Character.prototype.nextTile = function () {
  return this.game.tiles[this.pos.y + this.direction.y][this.pos.x + this.direction.x]
}

//PLAYER
function Player(game) {
  Character.call(game)
  this.gold = 0
  this.game = game
  this.pos = {
    x: 10,
    y: 10
  }

  this.moving = false

  this.width = this.game.offsetX
  this.height = this.game.offsetY

  this.direction = {x: 1, y: 0}
}

Player.prototype = Object.create(Character.prototype)

Player.prototype.update = function () {
  if(this.moving) this.move()
}

Player.prototype.move = function () {
  this.moving = false
  if(!this.nextTile().isWall) {
    this.pos.x += this.direction.x
    this.pos.y += this.direction.y
  }
}

Player.prototype.mine = function () {
  var next = this.nextTile()
  this.gold += next.gold
  next.destroy()
}

// ENEMY

function Enemy(game) {
  this.game = game
  Character.call(game)
  this.pos = {
    x: 10,
    y: 12
  }

  // this should be somewhere else?
  this.directions = [
    {x: -1, y: 0},
    {x: 1, y: 0},
    {x: 0, y: -1},
    {x: 0, y: 1}
  ]

  this.width = game.offsetX
  this.height = game.offsetY

  this.direction = this.directions[0]

  this.timeout = 0

}

Enemy.prototype = Object.create(Character.prototype)

Enemy.prototype.update = function () {
  this.timeout--
  if(this.timeout < 0) {
    this.timeout = 10
    var next = this.nextTile()
    if(next.isWall) {
      this.direction = this.directions[Math.floor(Math.random()*4)]
    } else {
      this.move()
    }
  }

}

Enemy.prototype.move = function () {
  this.pos.x += this.direction.x
  this.pos.y += this.direction.y
}

Enemy.prototype.nextTile = function () {
  //TODO: move to parent class "Character"?
  return this.game.tiles[this.pos.y + this.direction.y][this.pos.x + this.direction.x]
}


// TILE
function Tile(tiles, x, y) {
  this.tiles = tiles
  this.x = x
  this.y = y
  this.isWall = true
  this.gold = Math.random() < 0.05
  this.isDestructible = true
  this.discovered = false
}

Tile.prototype.destroy = function () {

  if(this.isDestructible){
    this.isWall = false
    this.isDestructible = false

    this.getNeighbours().forEach(function (neighbour) {
      neighbour.discovered = true
    })
  }
  return this.isWall
}

Tile.prototype.getNeighbours = function () {
  return [
    this.tiles[this.y + 1][this.x],
    this.tiles[this.y + 1][this.x + 1],
    this.tiles[this.y + 1][this.x - 1],
    this.tiles[this.y][this.x + 1],
    this.tiles[this.y][this.x - 1],
    this.tiles[this.y - 1][this.x],
    this.tiles[this.y - 1][this.x + 1],
    this.tiles[this.y - 1][this.x - 1]
  ]
}


//CONTROLLER
function Controller(player) {
  var directions = {
    37: {x: -1, y: 0},
    39: {x: 1, y: 0},
    38: {x: 0, y: -1},
    40: {x: 0, y: 1},
  }
  this. player = player
  this.player.moving = false

  document.addEventListener('keydown', function (e) {
    e.preventDefault()
    if(e.keyCode in directions) {
      this.player.direction = directions[e.keyCode]
      this.player.moving = true
    }
    else if(e.keyCode == 32) {
      this.player.mine()
    }
  }.bind(this))

  document.addEventListener('keyup', function (e) {
    e.preventDefault()
    if(e.keyCode in directions) {
      this.player.moving = false
    }
  }.bind(this))
}
