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

  preload(startGame)

  function startGame(images) {
    game.start()
    game.images = images
    var player = new Player(game)
    var controller = new Controller(player)

    game.enemies = []


    player.sprite = images.player
    requestAnimationFrame(draw)
    function draw(timestamp) {
      game.collision(player)

      player.update()
      game.enemies.forEach(function (enemy) {
        enemy.update()
      })

      for(var i = 0; i < game.tilesY; i++) {
        for(var j = 0; j < game.tilesX; j++) {
            var tileSprite
            var tile = game.tiles[i][j]
            if(tile.isWall) {
              if(tile.discovered) {
                if(!tile.isDestructible) {
                  tileSprite = images.stone
                } else if(tile.gold > 0) {
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

      game.enemies.forEach(function (enemy) {
        enemy.render(context)
      })

      // display

      context.fillStyle = 'yellow'
      context.font = 'bold 16px Arial'
      context.fillText(player.gold + ' gold', game.width - 70, game.height - 20)

      if(game.gameover) {
        context.fillStyle = 'white'
        context.font = 'bold 100px Arial'
        context.fillText('Game Over!', 100, game.height/2)
      }


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
     ghost: 'img/ghost.png',
     stone: 'img/stone.png'
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
  this.width = width
  this.height = height

  this.tilesX = 50
  this.tilesY = 40

  this.offsetX = this.width / this.tilesX
  this.offsetY = this.height / this.tilesY
}

Game.prototype.start = function () {
  this.tiles = []
  for(var i = 0; i < this.tilesY; i++) {
    this.tiles[i] = []
    for(var j = 0; j < this.tilesX; j++) {
      var newTile = new Tile(this, j, i)
      this.tiles[i][j] = newTile
      if(i === 0 || j === 0 || i === (this.tilesY - 1) || j === (this.tilesX - 1))
        newTile.isDestructible = false
    }
  }

}

Game.prototype.getTile = function(tileX, tileY) {
  return this.tiles[Math.floor(y / this.offsetY)][Math.floor(x / this.offsetX)]
}

Game.prototype.collision = function (player) {
  this.enemies.forEach(function (enemy) {
    if(enemy.pos.x === player.pos.x && enemy.pos.y === player.pos.y) {
      this.gameover = true
    }
  }.bind(this))
}

Game.prototype.spawnEnemy = function(pos){
  var enemy = new Enemy(this)
  enemy.pos = pos
  enemy.sprite = this.images.ghost
  this.enemies.push(enemy)
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

Character.prototype.getTile = function (offsetX, offsetY) {
  return this.game.tiles[this.pos.y + offsetY][this.pos.x + offsetX]
}

Character.prototype.nextTile = function () {
  return this.getTile(this.direction.x, this.direction.y)
}

Character.prototype.behindTile = function () {
  return this.getTile(-this.direction.x, -this.direction.y)
}

//PLAYER
function Player(game) {
  Character.call(game)
  this.gold = 0
  this.game = game
  this.pos = {
    x: 1 + Math.floor(Math.random()*(this.game.tilesX-2)),
    y: 1 + Math.floor(Math.random()*(this.game.tilesY-2))
  }
  this.game.tiles[this.pos.y][this.pos.x].destroy()
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
  var isEnemy = this.game.enemies.some(function (enemy) {
    if(enemy.active) return false
    return enemy.pos.x === this.pos.x + this.direction.x &&
      enemy.pos.y === this.pos.y + this.direction.y
  }.bind(this))
  if(!this.nextTile().isWall && !isEnemy) {
    this.pos.x += this.direction.x
    this.pos.y += this.direction.y
  }
}

Player.prototype.mine = function () {
  var next = this.nextTile()
  if (next.isDestructible){
    this.gold += next.gold
    if (next.hasEnemy){
      this.game.spawnEnemy(Object.create(next.pos))
    }
    next.destroy()
  }

}

// ENEMY

function Enemy(game) {
  this.game = game
  this.sprite = this.game.images.ghost
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

  this.timeout = 100
  this.active = false

}

Enemy.prototype = Object.create(Character.prototype)

Enemy.prototype.update = function () {
  this.timeout--
  if(this.timeout < 0) {
    if (!this.active) this.active = true
    this.timeout = 10
    var current = this.getTile(0, 0)
    var behind = this.behindTile()
    var possibleTiles = []
    current.getDirectNeighbours().forEach(function (neighbour) {
      if(!neighbour.isWall && (neighbour.x !== behind.x || neighbour.y !== behind.y)) {
        possibleTiles.push(neighbour)
      }
    })
    var nextTile
    if(possibleTiles.length === 0) nextTile = behind
    else nextTile = possibleTiles[Math.floor(Math.random()*possibleTiles.length)]
    this.direction.x = nextTile.x - this.pos.x
    this.direction.y = nextTile.y - this.pos.y

    this.move()
  }

}

Enemy.prototype.move = function () {
  this.pos.x += this.direction.x
  this.pos.y += this.direction.y
}


// TILE
function Tile(game, x, y) {
  this.game = game
  this.tiles = game.tiles
  this.x = x
  this.y = y
  this.pos = {x: x, y: y}
  this.isWall = true
  this.hasEnemy = Math.random() < 0.05
  this.gold = Math.random() < 0.05
  this.isDestructible = Math.random() < 0.95
  this.discovered = false
}

Tile.prototype.destroy = function () {

  this.isWall = false
  this.isDestructible = false

  this.getNeighbours().forEach(function (neighbour) {
    neighbour.discovered = true
  })
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
Tile.prototype.getDirectNeighbours = function () {
  return [
    this.tiles[this.y + 1][this.x],
    this.tiles[this.y][this.x + 1],
    this.tiles[this.y][this.x - 1],
    this.tiles[this.y - 1][this.x]
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
