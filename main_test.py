import numpy
from pylab import *
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from Model.heat_eq import HeatEquation

#import animation
import matplotlib.animation as animation

if __name__ == "__main__":
    # make initial condition a function of x
    def initial_condition(iteration, delta_x_step):
        return pow(sin(2 * pi * iteration * delta_x_step), 2)
        #return 0
        #return 2 * iteration * delta_x_step + 1
        #return iteration * (1 + iteration)
        #return sin(iteration * delta_x_step) - 6 * sin(4 * iteration * delta_x_step) 
        #return 20 * sin(2 * pi * iteration * delta_x_step) + 40 * sin(4 * pi * iteration * delta_x_step) - 50 * sin(5 * pi * iteration * delta_x_step)
        #return 0


    L, T, b0t, b1t, beta, delta_t, delta_x = 1, 1, 0, 0, 1, 0.004, 0.1
    heat_eq = HeatEquation(L, T, b0t, b1t, beta, delta_t, delta_x, initial_condition)
    print(heat_eq.print_tri_diag())
    print(heat_eq.print_initial_condition_vector())
    heat_eq.sigma_checker()
    matrix = heat_eq.return_u_matrix()
    print(f"temperature at time 250: {matrix[:, 250]}")

    # plot 3d

    plt.rcParams['figure.figsize'] = [8, 8]
    plt.rcParams['figure.dpi'] = 100
    plt.rcParams['figure.autolayout'] = False
    X = np.arange(0, heat_eq.N, 1)
    Y = np.arange(1, heat_eq.len_t + 1, 1)
    X, Y = np.meshgrid(X, Y)
    Z = matrix[X, Y]
    x_scale = (X - X.min()) / (X.max() - X.min())
    fig = plt.figure()

    ax = fig.add_subplot(211, projection='3d')
    surf = ax.plot_surface(x_scale, Y, Z, cmap='hot', linewidth=0, antialiased=False)
    fig.colorbar(surf, shrink=0.5, aspect=5)
    plt.title("Heat Equation")
    ax.set_xlabel("delta_x")
    ax.set_ylabel("Time")
    ax.set_zlabel("Temperature")

    # 2D heatmap

    ax = fig.add_subplot(212)
    pcolor_subplot = ax.pcolor(x_scale, Y, Z, cmap='hot')

    fig.colorbar(pcolor_subplot, shrink=0.5, aspect=5)
    plt.title("Heat Equation")
    ax.set_xlabel("delta_x")
    ax.set_ylabel("Time")
    # label for Z


    plt.show()

    # animate heatmap for the rod

    #fig, ax = plt.subplots()
    #pcolor_subplot = ax.pcolor(X, Y, Z, cmap='hot')
    #fig.colorbar(pcolor_subplot, shrink=0.5, aspect=5)
    #plt.title("Heat Equation")
    #plt.xlabel("X")
    #plt.ylabel("Time")

    #def animate(i):
    #    pcolor_subplot.set_array(Z[i])
    #    return pcolor_subplot,

    #anim = animation.FuncAnimation(fig, animate, frames=heat_eq.len_t, interval=100, blit=True)
    #plt.show()



