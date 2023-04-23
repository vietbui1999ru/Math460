import numpy
from pylab import *
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from Model.heat_eq import HeatEquation

if __name__ == "__main__":
    # make initial condition a function of x
    def initial_condition(iteration, delta_x_step):
        #return pow(sin(2 * pi * iteration * delta_x_step), 2)
        #return 0
        #return 2 * iteration * delta_x_step + 1
        return iteration * (1 + iteration)


    L, T, b0t, b1t, beta, delta_t, delta_x = 1, 1, 0, 0, 3, 0.004, 0.1
    heat_eq = HeatEquation(L, T, b0t, b1t, beta, delta_t, delta_x, initial_condition)
    print(heat_eq.print_tri_diag())
    print(heat_eq.print_initial_condition_vector())
    heat_eq.delta_checker()
    matrix = heat_eq.return_u_matrix()

    # plot 3d

    X = np.arange(0, heat_eq.N, 1)
    Y = np.arange(1, heat_eq.len_t + 1, 1)
    X, Y = np.meshgrid(X, Y)
    Z = matrix[X, Y]
    fig = plt.figure()

    ax = fig.add_subplot(111, projection='3d')
    surf = ax.plot_surface(X, Y, Z, cmap='hot', linewidth=0, antialiased=False)
    fig.colorbar(surf, shrink=0.5, aspect=5)
    plt.title("Heat Equation")
    plt.xlabel("X")
    plt.clabel("U")
    plt.ylabel("Time")
    print(Z)
    plt.show()

    # 2D heatmap

    fig, ax = plt.subplots()
    pcolor_subplot = ax.pcolor(X, Y, Z, cmap='hot')

    fig.colorbar(pcolor_subplot, shrink=0.5, aspect=5)
    plt.title("Heat Equation")
    plt.xlabel("X")
    plt.ylabel("Time")

    plt.show()

