import math
import random
import tkinter as tk


WIDTH = 900
HEIGHT = 520
GROUND = 442
PLAYER_X = 170


class FlipBirdDash:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Flip Bird Dash")
        self.root.resizable(False, False)

        self.canvas = tk.Canvas(self.root, width=WIDTH, height=HEIGHT, bg="#101820", highlightthickness=0)
        self.canvas.pack()

        self.root.bind("<space>", self.jump)
        self.root.bind("<Button-1>", self.jump)
        self.root.bind("<r>", self.restart)
        self.root.bind("<R>", self.restart)
        self.root.bind("<Escape>", lambda _event: self.root.destroy())

        self.best = 0
        self.reset()
        self.tick()

    def reset(self):
        self.player_y = 255
        self.velocity = 0
        self.gravity = 0.48
        self.jump_power = -8.8
        self.speed = 5.2
        self.score = 0
        self.frame = 0
        self.started = False
        self.game_over = False
        self.obstacles = []
        self.particles = []
        self.next_obstacle = 70

    def restart(self, _event=None):
        self.reset()

    def jump(self, _event=None):
        if self.game_over:
            self.restart()
            return
        self.started = True
        self.velocity = self.jump_power
        for _ in range(7):
            self.particles.append([
                PLAYER_X - 12,
                self.player_y + random.randint(-12, 12),
                random.uniform(-4.0, -1.2),
                random.uniform(-1.7, 1.7),
                18,
                "#6ee7ff",
            ])

    def spawn_obstacle(self):
        gap = random.randint(124, 158)
        center = random.randint(150, 330)
        top_h = center - gap // 2
        bottom_y = center + gap // 2
        hue_color = random.choice(["#ff3864", "#ffd166", "#7cff6b", "#9b5cff"])
        self.obstacles.append({
            "x": WIDTH + 40,
            "top": top_h,
            "bottom": bottom_y,
            "w": 62,
            "color": hue_color,
            "scored": False,
        })

    def update(self):
        self.frame += 1

        if self.started and not self.game_over:
            self.velocity += self.gravity
            self.player_y += self.velocity
            self.next_obstacle -= 1
            self.speed = min(8.6, 5.2 + self.score * 0.06)

            if self.next_obstacle <= 0:
                self.spawn_obstacle()
                self.next_obstacle = random.randint(72, 96)

            for obstacle in self.obstacles:
                obstacle["x"] -= self.speed
                if not obstacle["scored"] and obstacle["x"] + obstacle["w"] < PLAYER_X:
                    obstacle["scored"] = True
                    self.score += 1
                    self.best = max(self.best, self.score)

            self.obstacles = [ob for ob in self.obstacles if ob["x"] > -90]

            if self.player_y > GROUND - 22 or self.player_y < 18:
                self.end_game()

            for obstacle in self.obstacles:
                if self.collides(obstacle):
                    self.end_game()

        for particle in self.particles:
            particle[0] += particle[2]
            particle[1] += particle[3]
            particle[4] -= 1
        self.particles = [p for p in self.particles if p[4] > 0]

    def collides(self, obstacle):
        px1 = PLAYER_X - 19
        py1 = self.player_y - 19
        px2 = PLAYER_X + 19
        py2 = self.player_y + 19

        ox1 = obstacle["x"]
        ox2 = obstacle["x"] + obstacle["w"]
        hits_x = px2 > ox1 and px1 < ox2
        hits_top = py1 < obstacle["top"]
        hits_bottom = py2 > obstacle["bottom"]
        return hits_x and (hits_top or hits_bottom)

    def end_game(self):
        if self.game_over:
            return
        self.game_over = True
        for _ in range(24):
            self.particles.append([
                PLAYER_X,
                self.player_y,
                random.uniform(-5.5, 5.5),
                random.uniform(-5.5, 5.5),
                random.randint(18, 34),
                random.choice(["#ff3864", "#ffd166", "#6ee7ff", "#ffffff"]),
            ])

    def draw_background(self):
        self.canvas.create_rectangle(0, 0, WIDTH, HEIGHT, fill="#101820", outline="")
        for i in range(0, WIDTH, 38):
            offset = (self.frame * 2) % 38
            x = i - offset
            self.canvas.create_line(x, 0, x + 160, GROUND, fill="#162938", width=1)

        for i in range(0, WIDTH + 70, 70):
            x = i - (self.frame * 1.6) % 70
            self.canvas.create_rectangle(x, GROUND, x + 34, GROUND + 34, outline="#304a57", width=2)
            self.canvas.create_line(x, GROUND + 34, x + 34, GROUND, fill="#213946", width=2)

        self.canvas.create_rectangle(0, GROUND, WIDTH, HEIGHT, fill="#0b1117", outline="")
        self.canvas.create_line(0, GROUND, WIDTH, GROUND, fill="#6ee7ff", width=3)

    def draw_obstacles(self):
        for obstacle in self.obstacles:
            x = obstacle["x"]
            w = obstacle["w"]
            color = obstacle["color"]
            self.canvas.create_rectangle(x, 0, x + w, obstacle["top"], fill=color, outline="")
            self.canvas.create_rectangle(x, obstacle["bottom"], x + w, GROUND, fill=color, outline="")
            self.canvas.create_rectangle(x + 9, 0, x + w - 9, obstacle["top"], fill="#15151f", outline="")
            self.canvas.create_rectangle(x + 9, obstacle["bottom"], x + w - 9, GROUND, fill="#15151f", outline="")
            self.canvas.create_polygon(
                x, obstacle["top"],
                x + w / 2, obstacle["top"] - 20,
                x + w, obstacle["top"],
                fill=color,
                outline="",
            )
            self.canvas.create_polygon(
                x, obstacle["bottom"],
                x + w / 2, obstacle["bottom"] + 20,
                x + w, obstacle["bottom"],
                fill=color,
                outline="",
            )

    def draw_player(self):
        rotation = math.sin(self.frame * 0.18) * 0.18 + self.velocity * 0.035
        size = 25
        points = []
        base = [(-size, -size), (size, -size), (size, size), (-size, size)]
        for x, y in base:
            rx = x * math.cos(rotation) - y * math.sin(rotation)
            ry = x * math.sin(rotation) + y * math.cos(rotation)
            points.extend([PLAYER_X + rx, self.player_y + ry])

        self.canvas.create_polygon(points, fill="#ffd166", outline="#fff7c2", width=3)
        self.canvas.create_oval(PLAYER_X + 5, self.player_y - 12, PLAYER_X + 15, self.player_y - 2, fill="#101820", outline="")
        self.canvas.create_polygon(
            PLAYER_X + 20,
            self.player_y - 1,
            PLAYER_X + 38,
            self.player_y + 7,
            PLAYER_X + 20,
            self.player_y + 15,
            fill="#ff3864",
            outline="",
        )

    def draw_particles(self):
        for x, y, _vx, _vy, life, color in self.particles:
            radius = max(1, life / 5)
            self.canvas.create_oval(x - radius, y - radius, x + radius, y + radius, fill=color, outline="")

    def draw_ui(self):
        self.canvas.create_text(28, 24, anchor="nw", text=f"Score {self.score}", fill="#f7fbff", font=("Segoe UI", 18, "bold"))
        self.canvas.create_text(28, 54, anchor="nw", text=f"Best {self.best}", fill="#8fb3c8", font=("Segoe UI", 12, "bold"))

        if not self.started and not self.game_over:
            self.canvas.create_text(WIDTH / 2, 174, text="FLIP BIRD DASH", fill="#f7fbff", font=("Segoe UI", 36, "bold"))
            self.canvas.create_text(WIDTH / 2, 226, text="Space / click - стрибок", fill="#9fd7eb", font=("Segoe UI", 16, "bold"))
            self.canvas.create_text(WIDTH / 2, 256, text="R - рестарт   Esc - вихід", fill="#607d8b", font=("Segoe UI", 12, "bold"))

        if self.game_over:
            self.canvas.create_text(WIDTH / 2, 178, text="CRASH!", fill="#ff3864", font=("Segoe UI", 42, "bold"))
            self.canvas.create_text(WIDTH / 2, 228, text=f"Score {self.score}", fill="#f7fbff", font=("Segoe UI", 20, "bold"))
            self.canvas.create_text(WIDTH / 2, 266, text="Натисни Space, клік або R", fill="#9fd7eb", font=("Segoe UI", 15, "bold"))

    def draw(self):
        self.canvas.delete("all")
        self.draw_background()
        self.draw_obstacles()
        self.draw_particles()
        self.draw_player()
        self.draw_ui()

    def tick(self):
        self.update()
        self.draw()
        self.root.after(16, self.tick)

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    FlipBirdDash().run()
