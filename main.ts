namespace SpriteKind {
    export const Goal = SpriteKind.create()
}

let player: Sprite = null
let ghosts: Sprite[] = []
let platforms: Sprite[] = []

let carriedGhost = false
let danger = 0
let dangerMax = 6
let onGhost = false
let jumpAvailable = true
let gameOver = false

let finish: Sprite = null

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

    scene.setBackgroundColor(15)

    ghosts = []
    platforms = []

    carriedGhost = false
    danger = 0
    onGhost = false
    jumpAvailable = true
    gameOver = false
    aimAngle = 0

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

    // ==========================
    // MAP (IMPROVED SPACING)
    // ==========================
    function makePlatform(x: number, y: number, w: number) {
        let p = sprites.create(image.create(w, 6), SpriteKind.Food)
        p.image.fill(8)
        p.setPosition(x, y)
        platforms.push(p)
    }

    // Start (safe)
    makePlatform(40, 110, 60)

    // Wide + varied jumps
    makePlatform(180, 85, 50)
    makePlatform(320, 55, 50)
    makePlatform(480, 95, 50)
    makePlatform(650, 60, 50)
    makePlatform(820, 90, 50)

    // Final platform (challenge)
    makePlatform(1000, 70, 80)

    // Spawn player safely
    player.setPosition(40, 100)

    // ==========================
    // GOAL
    // ==========================
    finish = sprites.create(img`
        4 4 4 4 4 4 4 4 4 4
        4 . . . . . . . . 4
        4 . . . . . . . . 4
        4 4 4 4 4 4 4 4 4 4
    `, SpriteKind.Goal)

    finish.setPosition(1000, 45)

    // ==========================
    // AIM LINE
    // ==========================
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

    g.setPosition(randint(player.x + 80, player.x + 200), randint(30, 100))
    ghosts.push(g)
}

// ==========================
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (!gameOver && jumpAvailable && player.vy == 0) {
        player.vy = -220
        jumpAvailable = false
    }
})

// AIM
controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    if (!gameOver) aimAngle -= 10
})

controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    if (!gameOver) aimAngle += 10
})

// ==========================
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {

    if (gameOver) return

    if (carriedGhost) {
        let length = 50
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

    if (player.y > 140) loseGame()

    // PLATFORM COLLISION
    for (let p of platforms) {
        if (player.vy >= 0) {
            let withinX = player.right > p.left && player.left < p.right

            if (withinX && player.bottom >= p.top && player.bottom <= p.top + 6) {
                player.vy = 0
                player.bottom = p.top
                jumpAvailable = true
            }
        }
    }

    // GHOST COLLISION
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

    if (!gameOver) {

        // DANGER
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

        // SPAWN SYSTEM
        if (ghosts.length == 0) {
            spawnGhost()
            lastSpawnTime = game.runtime()
        }

        if (game.runtime() - lastSpawnTime > 10000) {
            spawnGhost()
            lastSpawnTime = game.runtime()
        }
    }

    // AIM LINE
    let length = 50
    let dx = Math.cos(aimAngle * Math.PI / 180) * length
    let dy = Math.sin(aimAngle * Math.PI / 180) * length
    aimLine.setPosition(player.x + dx, player.y + dy)

    // STOP PLAYER AFTER END
    if (gameOver) {
        player.vx = 0
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