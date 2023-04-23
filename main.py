import numpy
from pylab import *
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
# import delay library
#from time import sleep as delay

boundary_0t1 = 0
boundary_1t1 = 0
boundary_0t2 = 20
boundary_1t2 = 50

delta_t_short = 0.004
delta_x_short = 0.1

delta_t_long = 0.00004
delta_x_long = 0.01

L = 1
N_short = L / delta_x_short
N_long = L / delta_x_long

choice = int(input("Choose short / long - 1/2:"))
if choice == 1:
    N = N_short
elif choice == 2:
    N = N_long
T = 1

# Total number of grid points in X
N = int(N + 1)
print("Length of N: ", N)
print("T = ", T)

# 2 discretize time

A_1 = np.zeros((N, N))
#print("A = ", A_1)

A_2 = np.zeros((N, N))
#print("A = ", A_1)

# let delta = beta * delta_t / delta_x^2
beta = 1
delta = beta * delta_t_short / delta_x_short ** 2
if delta < 0.5:
    print("delta = ", delta, "is less than 0.5. The model would work")
else:
    print("delta = ", delta, "is not less than 0.5. The model doesn't work")

# length of matrix

u_1 = zeros(N)
u_2 = zeros(N)

# create tri-diagonal matrix
for i in range(1, N - 1):
    if i == 1:
        A_1[i][i - 1] = 0
        A_1[i][i + 1] = delta
    elif i == N - 2:
        A_1[i][i - 1] = delta
        A_1[i][i + 1] = 0
    else:
        A_1[i][i - 1] = delta
        A_1[i][i + 1] = delta
    A_1[i][i] = 1 - 2 * delta
print("A_1 tri-diagonal = \n", A_1)

for i in range(0, N):
    if i == 0:
        A_2[i][i + 1] = delta
    elif i == N - 1:
        A_2[i][i - 1] = delta
    else:
        A_2[i][i + 1] = delta
        A_2[i][i - 1] = delta
    A_2[i][i] = 1 - 2 * delta
print("A_2 tri-diagonal = \n", A_2)

# 4 set boundary conditions
u_bound_1 = zeros(N)
u_bound_2 = zeros(N)

u_bound_1[0] = boundary_0t1 #1st question
u_bound_2[0] = 20 # 2nd question

u_bound_1[N - 1] = boundary_1t1 #1st question
u_bound_2[N - 1] = 50 # 2nd question

#initial condition array 
for i in range(1, N - 1):
   u_1[i] = sin(2 * pi * i * delta_x_short) * sin(2 * pi * i * delta_x_short) # 1st question
   #u[i] = (i  + i ** 2) * delta_x # rapid increase in temperature from 0
   #u[i] = (i  - i ** 2) * delta_x # rapid decrease in temperature -> 0

for i in range(0, N):
    u_2[i] = 0 # 2nd question


print("u_1 = ", u_1)
print("u_2 = ", u_2)

# length of time array (adding T + 1, because we're predicting into the future beyond the time we set)
t = np.arange(0, T, delta_t_short)
len_t = len(t)
print("Length of time: ", len_t)
print("Length of N: ", N)
u_matrix_1 = np.zeros((N, len_t + 1))
u_matrix_2 = np.zeros((N, len_t + 1))
print("u_matrix_1 = ", u_matrix_1)
print("u_matrix_2 = ", u_matrix_2)
print("Row length of u_matrix = ", len(u_matrix_1))
# initial condition vector matrix
for i in range(1, N - 1):
    u_matrix_1[i][1] = u_1[i]

print("u_matrix = \n", u_matrix_1)
print("horizontal length = ", len(u_matrix_1[0]))
print("vertical length = ", len(u_matrix_1))

# 1st question
for i in range(1, len_t):
    u_matrix_1[1:N-1, i + 1] = np.dot(A_1[1:N-1, 1:N-1], u_matrix_1[1:N-1, i]) + u_bound_1[1:N-1]

# 2nd question
#for i in range(1, len_t - 1):
#    u_matrix[:, i + 1] = np.dot(A[:, :], u_matrix[:, i]) + u_bound[:]

#print("u_matrix = \n", u_matrix)
print("u_matrix_1 = \n", u_matrix_1)

# plot 3 dimensional graph

X = np.arange(0, N, 1)
Y = np.arange(1, len_t + 1, 1)
print("X = ", X)
print("Y = ", Y)
X, Y = np.meshgrid(X, Y)
Z = u_matrix_1[X, Y]
print("X = ", X)
print("Y = ", Y)
print("Z = ", Z)
print(Z.shape)


fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')
surf = ax.plot_surface(X, Y, Z, cmap='hot', linewidth=0, antialiased=False)
fig.colorbar(surf, shrink=0.5, aspect=5)
plt.title("Heat Equation")
plt.xlabel("X")
plt.clabel("U")
plt.ylabel("Time")

plt.show()

# 2D heatmap

fig, ax = plt.subplots()
pcolor_subplot = ax.pcolor(X, Y, Z, cmap='hot')

fig.colorbar(pcolor_subplot, shrink=0.5, aspect=5)
plt.title("Heat Equation")
plt.xlabel("X")
plt.ylabel("Time")

plt.show()




