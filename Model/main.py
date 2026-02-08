import matplotlib.pyplot as plt
import pylab
import numpy as np
from matplotlib import gridspec
from mpl_toolkits.mplot3d import Axes3D
import matplotlib.animation as animation

# discretize time and space

delta_x = 0.05
delta_t = 0.025

b0t = 0
b1t = 0

u_0 = fx = lambda x: np.sin(np.pi* x * delta_x)
ut_0 = gx = lambda x: 0

L = 1
T = 1

# this is C -> C^2
beta = 2 # -> 4

sigma = beta * delta_t / delta_x

sigma = sigma ** 2
print(f"Sigma {sigma}")

N = int((L / delta_x) + 1)
len_t = int((T / delta_t) + 1)

# create tri-diagonal matrix
A = np.zeros((N, N))

for i in range(N):
    if i == 0:
        A[i][i + 1] = sigma
    elif i == N - 1:
        A[i][i - 1] = sigma
    else:
        A[i][i + 1] = sigma
        A[i][i - 1] = sigma
    A[i][i] = 2 - 2 * sigma
A[0,:] = 0
A[0, 0] = 1
A[N - 1, :] = 0
A[N - 1, N - 1] = 1

"""This prints the shape and the tri-diagonal matrix"""
#print(A.shape)
#print(A)

# initial condition vector

u = np.zeros(N)
for i in range(0, N):
    u[i] = u_0(i)


