namespace SpriteKind {
    export const Goal = SpriteKind.create()
}

let player: Sprite = null
let ghosts: Sprite[] = []
let carriedGhost = false
let danger = 0
let dangerMax = 6
let onGhost = false
let jumpAvailable = true
let gameOver = false
let finish: Sprite = null
let ground: Sprite = null

let aimAngle = 0
let aimLine: Sprite = null

let lastSpawnTime = 0

// ==========================
function startGame() {

    sprites.destroyAllSpritesOfKind(SpriteKind.Player)
    sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
    sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
    sprites.destroyAllSpritesOfKind(SpriteKind.Goal)
    sprites.destroyAllSpritesOfKind(SpriteKind.Food)

    scene.setBackgroundColor(9)

    ghosts = []
    carriedGhost = false
    danger = 0
    onGhost = false
    jumpAvailable = true
    gameOver = false
    aimAngle = 0

    player = sprites.create(img`
        . . 2 2 2 . .
        . 2 2 2 2 2 .
        . 2 2 2 2 2 .
        . . 2 2 2 . .
    `, SpriteKind.Player)

    controller.moveSprite(player, 100, 0)
    player.ay = 500

    ground = sprites.create(img`
        8888888888888888888888888888888888888888
    `, SpriteKind.Food)
    ground.setPosition(40, 110)

    player.setPosition(40, ground.y - 6)

    finish = sprites.create(img`
        4 4 4 4 4 4 4 4 4 4
        4 . . . . . . . . 4
        4 . . . . . . . . 4
        4 4 4 4 4 4 4 4 4 4
    `, SpriteKind.Goal)
    finish.setPosition(140, 60)

    aimLine = sprites.create(img`
        1 1 1 1 1 1
        1 1 1 1 1 1
    `, SpriteKind.Projectile)
    aimLine.setFlag(SpriteFlag.Ghost, true)

    spawnGhost()
    lastSpawnTime = game.runtime()

    info.setScore(0)
}

// ==========================
function spawnGhost() {
    let g = sprites.create(img`
        . 5 5 .
        5 5 5 5
        5 5 5 5
        . 5 5 .
    `, SpriteKind.Enemy)

    g.setPosition(randint(80, 150), randint(30, 90))
    ghosts.push(g)
}

// ==========================
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (jumpAvailable && player.vy == 0) {
        player.vy = -200
        jumpAvailable = false
    }
})

// AIM
controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    aimAngle -= 10
})

controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    aimAngle += 10
})

// ==========================
// SHOOT / PLACE
// ==========================
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {

    if (gameOver) return

    // PLACE
    if (carriedGhost) {

        let length = 40
        let dx = Math.cos(aimAngle * Math.PI / 180) * length
        let dy = Math.sin(aimAngle * Math.PI / 180) * length

        let g = sprites.create(img`
            . 5 5 .
            5 5 5 5
            5 5 5 5
            . 5 5 .
        `, SpriteKind.Enemy)

        g.setPosition(player.x + dx, player.y + dy)

        ghosts.push(g)
        carriedGhost = false
        return
    }

    // SHOOT
    let vx = Math.cos(aimAngle * Math.PI / 180) * 200
    let vy = Math.sin(aimAngle * Math.PI / 180) * 200

    let bullet = sprites.create(img`
        2 2
        2 2
    `, SpriteKind.Projectile)

    bullet.setPosition(player.x, player.y)
    bullet.vx = vx
    bullet.vy = vy
})

// ==========================
// BULLET → COLLECT
// ==========================
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (bullet, ghost) {

    bullet.destroy()

    for (let i = 0; i < ghosts.length; i++) {
        if (ghosts[i] == ghost) {
            ghosts.removeAt(i)
            break
        }
    }

    ghost.destroy()

    if (!carriedGhost) {
        carriedGhost = true
    }
})

// ==========================
game.onUpdate(function () {

    if (gameOver) return

    if (player.y > 130) loseGame()

    // GROUND COLLISION
    if (player.vy >= 0) {
        let withinX = player.right > ground.left && player.left < ground.right

        if (withinX && player.bottom >= ground.top && player.bottom <= ground.top + 6) {
            player.vy = 0
            player.bottom = ground.top
            jumpAvailable = true
        }
    }

    // GHOST PLATFORM COLLISION
    for (let g of ghosts) {
        if (player.vy >= 0) {
            let withinX = player.right > g.left && player.left < g.right

            if (withinX && player.bottom >= g.top && player.bottom <= g.top + 6) {
                player.vy = 0
                player.bottom = g.top
                jumpAvailable = true
            }
        }
    }

    // DANGER SYSTEM
    onGhost = false
    for (let g of ghosts) {
        if (player.overlapsWith(g)) {
            onGhost = true
        }
    }

    if (onGhost) {
        if (game.runtime() % 1000 < 30) danger += 1
    } else {
        danger = 0
    }

    info.setScore(danger)

    if (danger >= dangerMax) loseGame()
    if (player.overlapsWith(finish)) winGame()

    // ==========================
    // INSTANT SPAWN FIX (IMPORTANT)
    // ==========================
    if (ghosts.length == 0) {
        spawnGhost()
        lastSpawnTime = game.runtime()
    }

    // Spawn every 10 seconds
    if (game.runtime() - lastSpawnTime > 10000) {
        spawnGhost()
        lastSpawnTime = game.runtime()
    }

    // AIM LINE
    let length = 40
    let dx = Math.cos(aimAngle * Math.PI / 180) * length
    let dy = Math.sin(aimAngle * Math.PI / 180) * length
    aimLine.setPosition(player.x + dx, player.y + dy)

    // VISUAL
    if (carriedGhost) {
        player.setImage(img`
            . . 2 2 2 . .
            . 2 2 5 2 2 .
            . 2 2 2 2 2 .
            . . 2 2 2 . .
        `)
    } else {
        player.setImage(img`
            . . 2 2 2 . .
            . 2 2 2 2 2 .
            . 2 2 2 2 2 .
            . . 2 2 2 . .
        `)
    }
})

// ==========================
function loseGame() {
    gameOver = true
    game.splash("YOU LOSE", "Press MENU")
}

function winGame() {
    gameOver = true
    game.splash("YOU WIN!", "Press MENU")
}

controller.menu.onEvent(ControllerButtonEvent.Pressed, function () {
    startGame()
})

startGame()