namespace SpriteKind {
    export const Goal = SpriteKind.create()
    export const Coin = SpriteKind.create()
    export const Button = SpriteKind.create()
    export const BigGhost = SpriteKind.create()
}

let player: Sprite = null
let ghosts: Sprite[] = []
let platforms: Sprite[] = []

let carriedGhost = false
let jumpAvailable = true
let gameOver = false

let aimAngle = 0
let aimLine: Sprite = null

let coins = 0

// ==========================
// FUNCTIONS

function makePlatform(x: number, y: number, w: number) {
    let p = sprites.create(image.create(w, 6), SpriteKind.Food)
    p.image.fill(8)
    p.setPosition(x, y)
    platforms.push(p)
}

function makeCoin(x: number, y: number) {
    let c = sprites.create(img`
        . 5 5 .
        5 5 5 5
        5 5 5 5
        . 5 5 .
    `, SpriteKind.Coin)
    c.setPosition(x, y)
}

function spawnGhost(x: number, y: number) {
    let g = sprites.create(img`
        . 1 1 .
        1 1 1 1
        1 1 1 1
        . 1 1 .
    `, SpriteKind.Enemy)
    g.setPosition(x, y)
    ghosts.push(g)
}

// ==========================
function startGame() {

    sprites.destroyAllSpritesOfKind(SpriteKind.Player)
    sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
    sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
    sprites.destroyAllSpritesOfKind(SpriteKind.Goal)
    sprites.destroyAllSpritesOfKind(SpriteKind.Food)
    sprites.destroyAllSpritesOfKind(SpriteKind.Coin)
    sprites.destroyAllSpritesOfKind(SpriteKind.Button)
    sprites.destroyAllSpritesOfKind(SpriteKind.BigGhost)

    scene.setBackgroundColor(15)

    ghosts = []
    platforms = []

    carriedGhost = false
    jumpAvailable = true
    gameOver = false
    aimAngle = 0
    coins = 0
    info.setScore(0)

    // PLAYER
    player = sprites.create(img`
        . . 2 2 2 . .
        . 2 2 2 2 2 .
        . 2 2 2 2 2 .
        . . 2 2 2 . .
    `, SpriteKind.Player)

    controller.moveSprite(player, 100, 0)
    player.ay = 500
    scene.cameraFollowSprite(player)

    // 起
    makePlatform(50, 110, 150)
    makeCoin(120, 40)
    spawnGhost(90, 80)
    spawnGhost(140, 75)

    // 承
    makePlatform(300, 100, 60)
    makePlatform(450, 70, 60)
    makePlatform(600, 100, 60)

    makeCoin(450, 40)
    makeCoin(600, 60)

    spawnGhost(320, 80)
    spawnGhost(400, 60)
    spawnGhost(500, 80)
    spawnGhost(580, 60)

    // 転
    makePlatform(800, 110, 120)
    makePlatform(800, 50, 120)

    spawnGhost(760, 80)
    spawnGhost(840, 70)

    let midGhost = sprites.create(img`
        1 1 1 1
        1 1 1 1
        1 1 1 1
        1 1 1 1
    `, SpriteKind.Enemy)
    midGhost.setPosition(800, 90)

    let button = sprites.create(img`
        2 2
        2 2
    `, SpriteKind.Button)
    button.setPosition(850, 90)

    // AIM
    aimLine = sprites.create(img`1 1 1 1`, SpriteKind.Projectile)
    aimLine.setFlag(SpriteFlag.Ghost, true)

    player.setPosition(50, 100)
}

// ==========================
// CONTROLS

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (!gameOver && jumpAvailable && player.vy == 0) {
        player.vy = -220
        jumpAvailable = false
    }
})

controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    aimAngle -= 10
})

controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    aimAngle += 10
})

controller.B.onEvent(ControllerButtonEvent.Pressed, function () {

    if (carriedGhost) {
        let dx = Math.cos(aimAngle * Math.PI / 180) * 60
        let dy = Math.sin(aimAngle * Math.PI / 180) * 60

        let g = sprites.create(img`
            . 1 1 .
            1 1 1 1
            1 1 1 1
            . 1 1 .
        `, SpriteKind.Enemy)

        g.setPosition(player.x + dx, player.y + dy)
        ghosts.push(g)
        carriedGhost = false
        return
    }

    let bullet = sprites.create(img`2 2 2 2`, SpriteKind.Projectile)
    bullet.setPosition(player.x, player.y)
    bullet.vx = Math.cos(aimAngle * Math.PI / 180) * 200
    bullet.vy = Math.sin(aimAngle * Math.PI / 180) * 200
})

// ==========================
// COLLISIONS

sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (b, g) {
    b.destroy()
    g.destroy()
    carriedGhost = true
})

// ⭐ COIN → WIN
sprites.onOverlap(SpriteKind.Player, SpriteKind.Coin, function (p, c) {
    c.destroy()
    coins += 1
    info.setScore(coins)

    if (coins >= 6) {
        game.splash("YOU WIN!")
        game.reset()
    }
})

sprites.onOverlap(SpriteKind.Player, SpriteKind.BigGhost, function () {
    game.splash("YOU LOSE")
    game.reset()
})

// FINAL LEVEL
sprites.onOverlap(SpriteKind.Player, SpriteKind.Button, function (p, b) {
    b.destroy()

    player.setPosition(1100, 80)

    makePlatform(1100, 110, 180)

    for (let i = 1; i <= 6; i++) {
        let px = 1100 + i * 180
        if (i == 4) px += 120

        let py = 100 - (i % 3) * 20

        makePlatform(px, py, 60)
        makeCoin(px, py - 25)
        spawnGhost(px - 70, py - 10)
    }

    let finalBoss = sprites.create(img`
        1 1 1 1 1 1
        1 1 1 1 1 1
        1 1 1 1 1 1
        1 1 1 1 1 1
    `, SpriteKind.BigGhost)
    finalBoss.setPosition(1600, 80)
})

// ==========================
game.onUpdate(function () {

    if (ghosts.length < 2) {
        spawnGhost(player.x + randint(60, 120), randint(40, 100))
    }

    for (let p of platforms) {
        if (player.vy >= 0 &&
            player.right > p.left &&
            player.left < p.right &&
            player.bottom >= p.top &&
            player.bottom <= p.top + 6) {

            player.vy = 0
            player.bottom = p.top
            jumpAvailable = true
        }
    }

    for (let g of ghosts) {
        if (player.vy >= 0 &&
            player.right > g.left &&
            player.left < g.right &&
            player.bottom >= g.top &&
            player.bottom <= g.top + 6) {

            player.vy = 0
            player.bottom = g.top
            jumpAvailable = true
        }
    }

    let dx = Math.cos(aimAngle * Math.PI / 180) * 50
    let dy = Math.sin(aimAngle * Math.PI / 180) * 50
    aimLine.setPosition(player.x + dx, player.y + dy)
})

startGame()