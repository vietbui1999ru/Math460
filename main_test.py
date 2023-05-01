import numpy
from pylab import *
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from Model.heat_eq import HeatEquation
from matplotlib import gridspec

#import animation
import matplotlib.animation as animation

if __name__ == "__main__":

    # !CHANGE INITIAL CONDITIONS IN THIS FUNCTION HERE!
    def initial_condition(iteration, delta_x_step):

        return pow(sin(2 * pi * iteration * delta_x_step), 2)
        #return 0
        #return 2 * iteration * delta_x_step + 1
        #return iteration * (1 + iteration)
        #return sin(iteration * delta_x_step) - 6 * sin(4 * iteration * delta_x_step) 
        #return 20 * sin(2 * pi * iteration * delta_x_step) + 40 * sin(4 * pi * iteration * delta_x_step) - 50 * sin(5 * pi * iteration * delta_x_step)


    # !CHANGE DIFFERENT CONDITIONS IN THE COMPONENTS HERE!
    L, T, b0t, b1t, beta, delta_t, delta_x = 1, 1, 20, 50, 1, 0.004, 0.01
    heat_eq = HeatEquation(L, T, b0t, b1t, beta, delta_t, delta_x, initial_condition)
    print(heat_eq.sigma_checker())
    matrix = heat_eq.return_u_matrix()

    print(f"matrix at x = 1/2, t = 1/2, {matrix[heat_eq.N // 2 ][heat_eq.len_t // 2]}")
    print(f"matrix at x = 1/4, t = 1/2, {matrix[heat_eq.N // 4 ][heat_eq.len_t // 2]}")

    # plot 3d

    plt.rcParams['figure.figsize'] = [8, 8]
    plt.rcParams['figure.dpi'] = 100
    plt.rcParams['figure.autolayout'] = False
    X = np.arange(0, heat_eq.N, 1)
    Y = np.arange(1, heat_eq.len_t + 1, 1)
    X, Y = np.meshgrid(X, Y)
    Z = matrix[X, Y]
    x_scale = (X - X.min()) / (X.max() - X.min())
    t_scale = (Y - Y.min()) / (Y.max() - Y.min())


    fig = plt.figure(figsize=(8, 8), constrained_layout=True)

    gs = gridspec.GridSpec(2, 2, width_ratios=[2, 1], height_ratios=[1, 1])

    ax1 = fig.add_subplot(gs[0, 0], projection='3d')
    surf = ax1.plot_surface(x_scale, Y, Z, cmap='hot', linewidth=0, antialiased=False)
    fig.colorbar(surf, shrink=0.5, aspect=5)
    plt.title("Heat Equation 3D")
    ax1.set_xlabel("delta_x")
    ax1.set_ylabel("Time")
    ax1.set_zlabel("Temperature")

    # 2D heatmap

    ax2 = fig.add_subplot(gs[0, 1])
    pcolor_subplot = ax2.pcolor(x_scale, Y, Z, cmap='hot')

    fig.colorbar(pcolor_subplot, shrink=0.5, aspect=5)
    plt.title("Heat Equation 2D")
    ax2.set_xlabel("delta_x")
    ax2.set_ylabel("Time")
    # label for Z

    # animate 2D heatmap

    #print(f'scale {scale}')
    scale = int(ceil(delta_x / delta_t ** 2 / 250 ** 2 * 2.5))
    def animate(i):

        pcolor_subplot.set_array(matrix[:, i * scale])
        # update label for y to reflect index i of time step
        ax3.set_ylabel(f"Time: {i * scale}")
        return pcolor_subplot,

    # animate for 2D heatmap

    a = input("Press Y to animate or N to skip: ")
    if a == 'Y':
        ax3 = fig.add_subplot(gs[1, :])
        pcolor_subplot = ax3.pcolor(x_scale, t_scale, Z, cmap='hot')

        fig.colorbar(pcolor_subplot, shrink=0.5, aspect=5)
        # set height of plot to be smaller
        ax3.set_box_aspect(0.1)

        plt.title("Animate Heat Equation")
        ax3.set_xlabel("delta_x")
        ax3.set_ylabel("Time")
        # label for Z
        anim = animation.FuncAnimation(fig, animate, frames=heat_eq.len_t, interval= 150, blit=True)
    elif a == 'N':
        pass
    else:
        print("Invalid input, skipping animation")
    plt.show()




