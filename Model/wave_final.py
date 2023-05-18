"""Consider the wave equation: utt = 16uxx on a string of length 1, with boundary conditions: u(0, t) = sin(t), u(1,
t) = 0, and initial conditions: u(x, 0) = ut(x, 0) = 0. Take ∆x = .05 and ∆t = .0025. Keep track of ALL position data
through every time step, and plot the complete numerical solution as a 3 dimensional plot u(x,t) above the xt-plane,
for 0 ≤ t ≤ 2pi, and 0 ≤ x ≤ 1."""

import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm
from matplotlib import animation as animation

L = 1.0
T = 2 * np.pi

f = 0
g = 0

dx = 0.05
dt = 0.0125
beta_square = 16
sigma = beta_square * (dt / dx) ** 2

# check sigma condition
if sigma > 1:
    print("Sigma condition not met!")
    print(f"Sigma = {sigma}")
    print(f"Sigma should be less than 1")
    exit()

print(f"Sigma = {sigma} <= 1")

Nx = int(L / dx) + 1
Nt = int(T / dt) + 1

# x = np.linspace(0, L, Nx)
# t = np.linspace(0, T, Nt)

u = np.zeros((Nx, Nt + 1))

for i in range(Nt):
    t = i * dt
    u[0, i] = np.sin(t)
    u[-1, i] = 0

# print(f"u: {u}")
# print(f"u shape: {u.shape}")
# set up tri-diagonal matrix

A = np.zeros((Nx, Nx))
A[0, 0] = 1
A[-1, -1] = 1
for i in range(1, Nx - 1):
    A[i, i - 1] = sigma
    A[i, i] = 2 - 2 * sigma
    A[i, i + 1] = sigma
# print(f"A: {A}")
# print(f"A shape: {A.shape}")

# solve for u

u_prev = np.zeros(Nx)
u_curr = u[:, 1]
# print(f"u_curr: {u_curr}")

for i in range(1, Nx - 1):
    u_prev[i] = u_curr[i] + 0.5 * sigma * (u_curr[i + 1] - 2 * u_curr[i] + u_curr[i - 1])

# print(f"u_prev: {u_prev}")
bdry = u.copy()

for i in range(1, Nt):
    # print(f"boundary condition: {u[0, i]}")
    u_next = A.dot(u_curr) + sigma * bdry[:, i] - u_prev
    # print(f"u_next: {u_next}")
    u[:, i + 1] = u_next
    u_prev = u_curr
    u_curr = u_next

# print(f"u: {u}")

# plot 3d graph

X = np.arange(0, Nx, 1)
Y = np.arange(0, Nt + 1, 1)
X, Y = np.meshgrid(X, Y)
Z = u[X, Y]

# store data in file

fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')
surf = ax.plot_surface(X, Y, Z, cmap=cm.coolwarm, linewidth=0, antialiased=False)
fig.colorbar(surf, shrink=0.5, aspect=5)
plt.show()

# plot 2d graph

for i in range(Nt):
    plt.plot(u[:, i])
plt.show()

# animate
def animate():
    fig = plt.figure()
    ax = plt.axes(xlim=(0, Nx), ylim=(-1, 1))
    line, = ax.plot([], [], lw=2)

    def init():
        line.set_data([], [])
        return line,

    def animate(i):
        x = np.linspace(0, Nx, Nx)
        y = u[:, i]
        line.set_data(x, y)
        return line,

    anim = animation.FuncAnimation(fig, animate, init_func=init, frames=Nt, interval=10, blit=True)
    plt.show()

animate()
