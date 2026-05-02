Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

$script:width = 900
$script:height = 520
$script:ground = 442
$script:playerX = 170
$script:rand = [System.Random]::new()

$script:best = 0
$script:playerY = 255.0
$script:velocity = 0.0
$script:score = 0
$script:frame = 0
$script:worldFrame = 0
$script:inMenu = $true
$script:started = $false
$script:gameOver = $false
$script:obstacles = [System.Collections.ArrayList]::new()
$script:particles = [System.Collections.ArrayList]::new()
$script:bgEffects = [System.Collections.ArrayList]::new()
$script:nextObstacle = 70
$script:crashCooldown = 0
$script:gravity = 0.72
$script:jumpPower = -10.2

function Reset-Game {
    $script:playerY = 255.0
    $script:velocity = 0.0
    $script:score = 0
    $script:frame = 0
    $script:worldFrame = 0
    $script:started = $true
    $script:gameOver = $false
    $script:obstacles.Clear()
    $script:particles.Clear()
    $script:bgEffects.Clear()
    $script:nextObstacle = 70
    $script:crashCooldown = 0
}

function Start-Game {
    Reset-Game
    $script:inMenu = $false
    $script:started = $true
}

function Add-Particle($x, $y, $vx, $vy, $life, $color) {
    [void]$script:particles.Add([pscustomobject]@{
        X = [double]$x
        Y = [double]$y
        VX = [double]$vx
        VY = [double]$vy
        Life = [int]$life
        Color = $color
    })
}

function Add-WallBurst($obstacle) {
    $colors = @(
        $obstacle.Color,
        [System.Drawing.Color]::FromArgb(110, 231, 255),
        [System.Drawing.Color]::FromArgb(247, 251, 255)
    )

    for ($i = 0; $i -lt 34; $i++) {
        if ($script:rand.NextDouble() -lt 0.5) {
            $y = $script:rand.Next(24, [math]::Max(25, [int]$obstacle.Top))
        } else {
            $y = $script:rand.Next([math]::Min($script:ground - 24, [int]$obstacle.Bottom), $script:ground - 8)
        }

        Add-Particle `
            ($obstacle.X + $obstacle.W / 2) `
            $y `
            (-5.6 + $script:rand.NextDouble() * 4.2) `
            (-2.8 + $script:rand.NextDouble() * 5.6) `
            ($script:rand.Next(18, 34)) `
            $colors[$script:rand.Next(0, $colors.Count)]
    }
}

function Add-ScoreBackgroundEffect($x, $y, $color) {
    [void]$script:bgEffects.Add([pscustomobject]@{
        X = [double]$x
        Y = [double]$y
        Life = 34
        MaxLife = 34
        Color = $color
        Kind = "Ring"
    })

    for ($i = 0; $i -lt 9; $i++) {
        [void]$script:bgEffects.Add([pscustomobject]@{
            X = [double]($x + $script:rand.Next(-100, 101))
            Y = [double]($y + $script:rand.Next(-80, 81))
            Life = $script:rand.Next(20, 34)
            MaxLife = 34
            Color = $color
            Kind = "Slash"
            Angle = $script:rand.NextDouble() * [math]::PI
        })
    }
}

function Jump-Player {
    if ($script:inMenu) {
        Start-Game
        return
    }

    if ($script:gameOver) {
        Start-Game
        return
    }

    $script:started = $true
    $script:velocity = $script:jumpPower
    for ($i = 0; $i -lt 7; $i++) {
        Add-Particle ($script:playerX - 12) ($script:playerY + $script:rand.Next(-12, 13)) (-4.0 + $script:rand.NextDouble() * 2.8) (-1.7 + $script:rand.NextDouble() * 3.4) 18 ([System.Drawing.Color]::FromArgb(110, 231, 255))
    }
}

function Spawn-Obstacle {
    $gap = $script:rand.Next(124, 159)
    $center = $script:rand.Next(150, 331)
    $colors = @(
        [System.Drawing.Color]::FromArgb(255, 56, 100),
        [System.Drawing.Color]::FromArgb(255, 209, 102),
        [System.Drawing.Color]::FromArgb(124, 255, 107),
        [System.Drawing.Color]::FromArgb(155, 92, 255)
    )

    [void]$script:obstacles.Add([pscustomobject]@{
        X = [double]($script:width + 40)
        Top = [double]($center - [math]::Floor($gap / 2))
        Bottom = [double]($center + [math]::Floor($gap / 2))
        W = 62.0
        Color = $colors[$script:rand.Next(0, $colors.Count)]
        Scored = $false
        Fading = $false
        Fade = 1.0
    })
}

function End-Game {
    if ($script:gameOver) { return }
    $script:gameOver = $true
    $script:started = $false
    $script:crashCooldown = 28
    $script:best = [math]::Max($script:best, $script:score)

    $colors = @(
        [System.Drawing.Color]::FromArgb(255, 56, 100),
        [System.Drawing.Color]::FromArgb(255, 209, 102),
        [System.Drawing.Color]::FromArgb(110, 231, 255),
        [System.Drawing.Color]::White
    )

    for ($i = 0; $i -lt 24; $i++) {
        Add-Particle $script:playerX $script:playerY (-5.5 + $script:rand.NextDouble() * 11) (-5.5 + $script:rand.NextDouble() * 11) ($script:rand.Next(18, 35)) $colors[$script:rand.Next(0, $colors.Count)]
    }

}

function Test-Collision($obstacle) {
    $px1 = $script:playerX - 19
    $py1 = $script:playerY - 19
    $px2 = $script:playerX + 19
    $py2 = $script:playerY + 19
    $ox1 = $obstacle.X
    $ox2 = $obstacle.X + $obstacle.W

    $hitsX = ($px2 -gt $ox1) -and ($px1 -lt $ox2)
    $hitsTop = $py1 -lt $obstacle.Top
    $hitsBottom = $py2 -gt $obstacle.Bottom
    return $hitsX -and ($hitsTop -or $hitsBottom)
}

function Update-Game {
    $script:frame += 1

    if ($script:inMenu) {
        $script:worldFrame += 0.35
        return
    }

    if ($script:gameOver) {
        $script:crashCooldown -= 1
        if ($script:crashCooldown -le 0) {
            Reset-Game
        }
    }

    if ($script:started -and -not $script:gameOver) {
        $script:worldFrame += 1
        $script:velocity += $script:gravity
        $script:playerY += $script:velocity
        $script:nextObstacle -= 1
        $speed = [math]::Min(8.6, 5.2 + $script:score * 0.06)

        if ($script:nextObstacle -le 0) {
            Spawn-Obstacle
            $script:nextObstacle = $script:rand.Next(72, 97)
        }

        for ($i = $script:obstacles.Count - 1; $i -ge 0; $i--) {
            $ob = $script:obstacles[$i]
            $ob.X -= $speed

            if (-not $ob.Scored -and ($ob.X + $ob.W) -lt $script:playerX) {
                $ob.Scored = $true
                $ob.Fading = $true
                $script:score += 1
                $script:best = [math]::Max($script:best, $script:score)
                Add-WallBurst $ob
                Add-ScoreBackgroundEffect ($script:playerX + 95) (($ob.Top + $ob.Bottom) / 2) $ob.Color
            }

            if ($ob.Fading) {
                $ob.Fade -= 0.08
            }

            if ($ob.X -lt -90 -or $ob.Fade -le 0) {
                $script:obstacles.RemoveAt($i)
            }
        }

        if (($script:playerY + 22) -gt ($script:ground - 20) -or ($script:playerY - 22) -lt 18) {
            End-Game
        }

        foreach ($ob in $script:obstacles) {
            if ($ob.Scored -or $ob.Fading) {
                continue
            }

            if (Test-Collision $ob) {
                End-Game
                break
            }
        }
    }

    for ($i = $script:particles.Count - 1; $i -ge 0; $i--) {
        $p = $script:particles[$i]
        $p.X += $p.VX
        $p.Y += $p.VY
        $p.Life -= 1
        if ($p.Life -le 0) {
            $script:particles.RemoveAt($i)
        }
    }

    for ($i = $script:bgEffects.Count - 1; $i -ge 0; $i--) {
        $effect = $script:bgEffects[$i]
        $effect.Life -= 1
        if ($effect.Life -le 0) {
            $script:bgEffects.RemoveAt($i)
        }
    }
}

function New-Brush($color) {
    return [System.Drawing.SolidBrush]::new($color)
}

function Draw-CenteredText($g, $text, $font, $brush, $x, $y) {
    $size = $g.MeasureString($text, $font)
    $g.DrawString($text, $font, $brush, [float]($x - $size.Width / 2), [float]$y)
}

function Draw-BackgroundEffects($g) {
    foreach ($effect in $script:bgEffects) {
        $t = [math]::Max(0, $effect.Life / $effect.MaxLife)
        $alpha = [int](190 * $t)
        $color = [System.Drawing.Color]::FromArgb($alpha, $effect.Color.R, $effect.Color.G, $effect.Color.B)

        if ($effect.Kind -eq "Ring") {
            $radius = 28 + (1 - $t) * 150
            $pen = [System.Drawing.Pen]::new($color, [float](2 + 7 * $t))
            $g.DrawEllipse(
                $pen,
                [float]($effect.X - $radius),
                [float]($effect.Y - $radius),
                [float]($radius * 2),
                [float]($radius * 2)
            )
            $pen.Dispose()
        } else {
            $length = 32 + (1 - $t) * 74
            $dx = [math]::Cos($effect.Angle) * $length
            $dy = [math]::Sin($effect.Angle) * $length
            $pen = [System.Drawing.Pen]::new($color, [float](2 + 4 * $t))
            $g.DrawLine(
                $pen,
                [float]($effect.X - $dx),
                [float]($effect.Y - $dy),
                [float]($effect.X + $dx),
                [float]($effect.Y + $dy)
            )
            $pen.Dispose()
        }
    }
}

function Draw-MainMenu($g, $fontBig, $fontScore, $fontMid, $fontSmall) {
    $white = New-Brush ([System.Drawing.Color]::FromArgb(247, 251, 255))
    $cyan = New-Brush ([System.Drawing.Color]::FromArgb(110, 231, 255))
    $green = New-Brush ([System.Drawing.Color]::FromArgb(124, 255, 107))
    $greenDark = New-Brush ([System.Drawing.Color]::FromArgb(32, 120, 62))
    $yellow = New-Brush ([System.Drawing.Color]::FromArgb(255, 209, 102))
    $dark = New-Brush ([System.Drawing.Color]::FromArgb(13, 22, 31))
    $muted = New-Brush ([System.Drawing.Color]::FromArgb(143, 179, 200))

    $cyanPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(110, 231, 255), 4)
    $greenPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(215, 255, 196), 5)
    $yellowPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 247, 194), 4)

    Draw-CenteredText $g "FLIP BIRD DASH" $fontBig $cyan ($script:width / 2 + 3) 104
    Draw-CenteredText $g "FLIP BIRD DASH" $fontBig $white ($script:width / 2) 100

    $cubeX = 214
    $cubeY = 230
    $g.FillRectangle($yellow, $cubeX, $cubeY, 78, 78)
    $g.DrawRectangle($yellowPen, $cubeX, $cubeY, 78, 78)
    $g.FillRectangle($dark, $cubeX + 19, $cubeY + 20, 13, 13)
    $g.FillRectangle($dark, $cubeX + 47, $cubeY + 20, 13, 13)
    $mouthPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(13, 22, 31), 5)
    $g.DrawLine($mouthPen, $cubeX + 22, $cubeY + 55, $cubeX + 58, $cubeY + 55)

    $pulse = [math]::Sin($script:frame * 0.12) * 4
    $playX = 382 - $pulse / 2
    $playY = 260 - $pulse / 2
    $playW = 136 + $pulse
    $playH = 94 + $pulse
    $g.FillRectangle($greenDark, [float]($playX + 6), [float]($playY + 7), [float]$playW, [float]$playH)
    $g.FillRectangle($green, [float]$playX, [float]$playY, [float]$playW, [float]$playH)
    $g.DrawRectangle($greenPen, [int]$playX, [int]$playY, [int]$playW, [int]$playH)

    $tri = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new([float]($playX + 52), [float]($playY + 25)),
        [System.Drawing.PointF]::new([float]($playX + 52), [float]($playY + $playH - 25)),
        [System.Drawing.PointF]::new([float]($playX + $playW - 37), [float]($playY + $playH / 2))
    )
    $g.FillPolygon($white, $tri)

    Draw-CenteredText $g "BEST $script:best" $fontScore $white ($script:width / 2) 384
    Draw-CenteredText $g "Space або Play - старт    Esc - вихід" $fontSmall $muted ($script:width / 2) 420

    for ($i = 0; $i -lt 6; $i++) {
        $x = 92 + $i * 132 + [math]::Sin(($script:frame + $i * 18) * 0.04) * 16
        $y = 468 + [math]::Sin(($script:frame + $i * 28) * 0.05) * 8
        $g.DrawRectangle($cyanPen, [int]$x, [int]$y, 34, 34)
    }

    $white.Dispose()
    $cyan.Dispose()
    $green.Dispose()
    $greenDark.Dispose()
    $yellow.Dispose()
    $dark.Dispose()
    $muted.Dispose()
    $cyanPen.Dispose()
    $greenPen.Dispose()
    $yellowPen.Dispose()
    $mouthPen.Dispose()
}

$form = [System.Windows.Forms.Form]::new()
$form.Text = "Flip Bird Dash"
$form.ClientSize = [System.Drawing.Size]::new($script:width, $script:height)
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedSingle
$form.MaximizeBox = $false
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$form.BackColor = [System.Drawing.Color]::FromArgb(16, 24, 32)
$form.DoubleBuffered = $true
$form.KeyPreview = $true

$styleFlags = [System.Windows.Forms.ControlStyles]::AllPaintingInWmPaint -bor `
    [System.Windows.Forms.ControlStyles]::UserPaint -bor `
    [System.Windows.Forms.ControlStyles]::OptimizedDoubleBuffer
$setStyle = [System.Windows.Forms.Control].GetMethod(
    "SetStyle",
    [System.Reflection.BindingFlags]::Instance -bor [System.Reflection.BindingFlags]::NonPublic
)
$setStyle.Invoke($form, @($styleFlags, $true))
$form.GetType().GetMethod(
    "UpdateStyles",
    [System.Reflection.BindingFlags]::Instance -bor [System.Reflection.BindingFlags]::NonPublic
).Invoke($form, @())

$fontBig = [System.Drawing.Font]::new("Segoe UI", 36, [System.Drawing.FontStyle]::Bold)
$fontCrash = [System.Drawing.Font]::new("Segoe UI", 42, [System.Drawing.FontStyle]::Bold)
$fontScore = [System.Drawing.Font]::new("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
$fontMid = [System.Drawing.Font]::new("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
$fontSmall = [System.Drawing.Font]::new("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)

$form.Add_KeyDown({
    if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Space) {
        Jump-Player
        $form.Invalidate()
    } elseif ($_.KeyCode -eq [System.Windows.Forms.Keys]::R) {
        Start-Game
        $form.Invalidate()
    } elseif ($_.KeyCode -eq [System.Windows.Forms.Keys]::Escape) {
        $form.Close()
    }
})

$form.Add_MouseDown({
    if ($script:inMenu) {
        $x = $_.X
        $y = $_.Y
        if ($x -ge 382 -and $x -le 518 -and $y -ge 260 -and $y -le 354) {
            Start-Game
        }
    } else {
        Jump-Player
    }
    $form.Invalidate()
})

$form.Add_Paint({
    param($sender, $event)
    $g = $event.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $bgBrush = New-Brush ([System.Drawing.Color]::FromArgb(16, 24, 32))
    $groundBrush = New-Brush ([System.Drawing.Color]::FromArgb(11, 17, 23))
    $gridPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(22, 41, 56), 1)
    $groundPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(110, 231, 255), 3)
    $tilePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(48, 74, 87), 2)
    $tileLinePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(33, 57, 70), 2)

    $g.FillRectangle($bgBrush, 0, 0, $script:width, $script:height)
    $offset = ($script:worldFrame * 2) % 38
    for ($i = 0; $i -lt $script:width + 38; $i += 38) {
        $x = $i - $offset
        $g.DrawLine($gridPen, [float]$x, 0, [float]($x + 160), [float]$script:ground)
    }

    $tileOffset = ($script:worldFrame * 1.6) % 70
    for ($i = 0; $i -lt $script:width + 70; $i += 70) {
        $x = $i - $tileOffset
        $g.DrawRectangle($tilePen, [int]$x, $script:ground, 34, 34)
        $g.DrawLine($tileLinePen, [float]$x, [float]($script:ground + 34), [float]($x + 34), [float]$script:ground)
    }

    Draw-BackgroundEffects $g

    $g.FillRectangle($groundBrush, 0, $script:ground, $script:width, $script:height - $script:ground)
    $g.DrawLine($groundPen, 0, $script:ground, $script:width, $script:ground)

    $wallPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 56, 100), 4)
    for ($i = 0; $i -lt $script:width; $i += 34) {
        $g.DrawLine($wallPen, $i, 18, $i + 17, 3)
        $g.DrawLine($wallPen, $i + 17, 3, $i + 34, 18)
        $g.DrawLine($wallPen, $i, $script:ground - 4, $i + 17, $script:ground - 20)
        $g.DrawLine($wallPen, $i + 17, $script:ground - 20, $i + 34, $script:ground - 4)
    }

    if ($script:inMenu) {
        Draw-MainMenu $g $fontBig $fontScore $fontMid $fontSmall
        $bgBrush.Dispose()
        $groundBrush.Dispose()
        $gridPen.Dispose()
        $groundPen.Dispose()
        $tilePen.Dispose()
        $tileLinePen.Dispose()
        $wallPen.Dispose()
        return
    }

    foreach ($ob in $script:obstacles) {
        $alpha = [int]([math]::Max(0, [math]::Min(255, 255 * $ob.Fade)))
        $obBrush = New-Brush ([System.Drawing.Color]::FromArgb($alpha, $ob.Color.R, $ob.Color.G, $ob.Color.B))
        $coreBrush = New-Brush ([System.Drawing.Color]::FromArgb($alpha, 21, 21, 31))
        $g.FillRectangle($obBrush, [float]$ob.X, 0, [float]$ob.W, [float]$ob.Top)
        $g.FillRectangle($obBrush, [float]$ob.X, [float]$ob.Bottom, [float]$ob.W, [float]($script:ground - $ob.Bottom))
        $g.FillRectangle($coreBrush, [float]($ob.X + 9), 0, [float]($ob.W - 18), [float]$ob.Top)
        $g.FillRectangle($coreBrush, [float]($ob.X + 9), [float]$ob.Bottom, [float]($ob.W - 18), [float]($script:ground - $ob.Bottom))

        $topSpike = [System.Drawing.PointF[]]@(
            [System.Drawing.PointF]::new([float]$ob.X, [float]$ob.Top),
            [System.Drawing.PointF]::new([float]($ob.X + $ob.W / 2), [float]($ob.Top - 20)),
            [System.Drawing.PointF]::new([float]($ob.X + $ob.W), [float]$ob.Top)
        )
        $bottomSpike = [System.Drawing.PointF[]]@(
            [System.Drawing.PointF]::new([float]$ob.X, [float]$ob.Bottom),
            [System.Drawing.PointF]::new([float]($ob.X + $ob.W / 2), [float]($ob.Bottom + 20)),
            [System.Drawing.PointF]::new([float]($ob.X + $ob.W), [float]$ob.Bottom)
        )
        $g.FillPolygon($obBrush, $topSpike)
        $g.FillPolygon($obBrush, $bottomSpike)
        $obBrush.Dispose()
        $coreBrush.Dispose()
    }

    foreach ($p in $script:particles) {
        $particleBrush = New-Brush $p.Color
        $radius = [math]::Max(1, $p.Life / 5)
        $g.FillEllipse($particleBrush, [float]($p.X - $radius), [float]($p.Y - $radius), [float]($radius * 2), [float]($radius * 2))
        $particleBrush.Dispose()
    }

    $rotation = [math]::Sin($script:worldFrame * 0.18) * 0.14 + $script:velocity * 0.035
    $size = 25
    $base = @(
        @(-$size, -$size),
        @($size, -$size),
        @($size, $size),
        @(-$size, $size)
    )
    $points = foreach ($pt in $base) {
        $rx = $pt[0] * [math]::Cos($rotation) - $pt[1] * [math]::Sin($rotation)
        $ry = $pt[0] * [math]::Sin($rotation) + $pt[1] * [math]::Cos($rotation)
        [System.Drawing.PointF]::new([float]($script:playerX + $rx), [float]($script:playerY + $ry))
    }

    $playerBrush = New-Brush ([System.Drawing.Color]::FromArgb(255, 209, 102))
    $playerPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 247, 194), 3)
    $eyeBrush = New-Brush ([System.Drawing.Color]::FromArgb(16, 24, 32))
    $beakBrush = New-Brush ([System.Drawing.Color]::FromArgb(255, 56, 100))
    $g.FillPolygon($playerBrush, [System.Drawing.PointF[]]$points)
    $g.DrawPolygon($playerPen, [System.Drawing.PointF[]]$points)
    $g.FillEllipse($eyeBrush, $script:playerX + 5, [float]($script:playerY - 12), 10, 10)
    $beak = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new($script:playerX + 20, [float]($script:playerY - 1)),
        [System.Drawing.PointF]::new($script:playerX + 38, [float]($script:playerY + 7)),
        [System.Drawing.PointF]::new($script:playerX + 20, [float]($script:playerY + 15))
    )
    $g.FillPolygon($beakBrush, $beak)

    $white = New-Brush ([System.Drawing.Color]::FromArgb(247, 251, 255))
    $muted = New-Brush ([System.Drawing.Color]::FromArgb(143, 179, 200))
    $blue = New-Brush ([System.Drawing.Color]::FromArgb(159, 215, 235))
    $dim = New-Brush ([System.Drawing.Color]::FromArgb(96, 125, 139))
    $red = New-Brush ([System.Drawing.Color]::FromArgb(255, 56, 100))

    $g.DrawString("Score $script:score", $fontScore, $white, 28, 24)
    $g.DrawString("Best $script:best", $fontSmall, $muted, 28, 54)

    if ($script:gameOver) {
        Draw-CenteredText $g "CRASH!" $fontCrash $red ($script:width / 2) 178
        Draw-CenteredText $g "Score $script:score" $fontScore $white ($script:width / 2) 228
        Draw-CenteredText $g "Restarting..." $fontMid $blue ($script:width / 2) 266
    }

    $bgBrush.Dispose()
    $groundBrush.Dispose()
    $gridPen.Dispose()
    $groundPen.Dispose()
    $tilePen.Dispose()
    $tileLinePen.Dispose()
    $wallPen.Dispose()
    $playerBrush.Dispose()
    $playerPen.Dispose()
    $eyeBrush.Dispose()
    $beakBrush.Dispose()
    $white.Dispose()
    $muted.Dispose()
    $blue.Dispose()
    $dim.Dispose()
    $red.Dispose()
})

$timer = [System.Windows.Forms.Timer]::new()
$timer.Interval = 16
$timer.Add_Tick({
    Update-Game
    $form.Invalidate()
})
$timer.Start()

[void][System.Windows.Forms.Application]::Run($form)
