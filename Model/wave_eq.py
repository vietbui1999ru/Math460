from pylab import *
from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm
import matplotlib.pyplot as plt
import matplotlib.animation as animation


class WaveEquation(object):
    def __init__(self, L, T, u0t, u1t, beta_square, delta_t, delta_x, g, f):

        self.L = L
        self.T = T
        self.u0t = u0t
        self.u1t = u1t
        self.beta_square = beta_square
        self.delta_t = delta_t
        self.delta_x = delta_x
        self.g = g
        self.f = f
        self.Nt = int(self.T / self.delta_t) + 1
        self.Nx = int(self.L / self.delta_x) + 1
        self.sigma = ((sqrt(self.beta_square) * self.delta_t) / self.delta_x) ** 2
        self.u_bound = np.zeros(self.Nx)
        # self.u_bound[0] = self.u0t(0)
        self.u_bound[0] = self.u0t
        self.u_bound[-1] = self.u1t
        self.A = self.tri_diagonal_matrix()

        # for t in range(1, self.Nt):
        #     print(f" result of u0t: {self.u0t(t * self.delta_t)}")
        #     self.u_matrix[0, t] = self.u0t(t * self.delta_t)
        #     print(f" result of u1t: {self.u1t(t * self.delta_t)}")
        #     self.u_matrix[-1, t] = self.u1t(t * self.delta_t)

        """Q1"""
        self.u_matrix = self.initial_condition_matrix()
        self.u_matrix[0, :] = self.u_bound[0]
        self.u_matrix[-1, :] = self.u_bound[-1]

    def initial_condition_matrix(self):

        u = np.zeros((self.Nx, self.Nt + 1))
        for i in range(self.Nx):
            # print(f"i = {i}")
            # print(f"delta x : {self.delta_x}")
            u[i, 0] = self.f(i * self.delta_x)

        # print(f"u: {u}")
        return u

    def print_matrix(self):
        print(self.u_matrix.shape)
        return self.u_matrix

    def sigma_checker(self):

        # print(f"delta_x = {self.delta_x}")
        # print(f"delta_t = {self.delta_t}")
        # print(f"beta = {self.beta}")
        # print(f"sigma = {self.sigma}")

        if self.sigma > 1:
            print(f"Warning: sigma = {self.sigma} > 1, model wouldn't be stable")
        else:
            print(f"sigma = {self.sigma} <= 1, model is stable")

    def tri_diagonal_matrix(self):

        A = zeros((self.Nx, self.Nx))
        A[0, 0] = 1
        A[-1, -1] = 1
        for i in range(1, self.Nx - 1):
            A[i, i] = 2 * (1 - self.sigma)
            A[i, i - 1] = self.sigma
            A[i, i + 1] = self.sigma

        return A

    def wave_equation_solver(self):

        u_curr = self.u_matrix[:, 0]
        print(f"u_curr: {u_curr}")

        u_prev = np.zeros(self.Nx)
        u_prev[0] = self.u0t
        u_prev[-1] = self.u1t
        for i in range(1, self.Nx - 1):
            u_prev[i] = u_curr[i] - self.delta_t * self.g(i * self.delta_x) + 0.5 * self.sigma * (
                    u_curr[i - 1] - 2 * u_curr[i] + u_curr[i + 1])

        # print(f"u_prev: {u_prev}")
        for n in range(0, self.Nt):
            u_next = np.dot(self.A, u_curr) - u_prev
            self.u_matrix[:, n + 1] = u_next
            u_prev = u_curr
            u_curr = u_next

        return self.u_matrix
        # for n in range(1, self.Nt):
        #
        #     self.u_matrix[:, n + 1] = np.dot(self.A, self.u_matrix[:, n]) - u_prev + self.sigma * np.array(
        #         [self.g(i * self.delta_x) for i in range(self.Nx)])

        # initial condition

    def plot_3d(self):

        X = np.arange(0, self.Nx, 1)
        Y = np.arange(0, self.Nt + 1, 1)
        X, Y = np.meshgrid(X, Y)
        Z = self.u_matrix[X, Y]

        fig = plt.figure()
        ax = fig.add_subplot(111, projection='3d')
        surf = ax.plot_surface(X, Y, Z, cmap=cm.coolwarm, linewidth=0, antialiased=False)
        fig.colorbar(surf, shrink=0.5, aspect=5)
        plt.show()

    def plot_2d(self):
        for i in range(self.Nt):
            plt.plot(self.u_matrix[:, i])
        plt.show()

    def animate(self):
        fig = plt.figure()
        ax = plt.axes(xlim=(0, self.L), ylim=(-1, 1))
        line, = ax.plot([], [], lw=2)

        def init():
            line.set_data([], [])
            return line,

        def animate(i):
            x = np.linspace(0, self.L, self.Nx)
            y = self.u_matrix[:, i]
            line.set_data(x, y)
            return line,

        anim = animation.FuncAnimation(fig, animate, init_func=init,
                                       frames=self.Nt, interval=20, blit=True)
        plt.show()


if __name__ == '__main__':
    # def u0t(t):
    #     return 0

    # def u1t(t):
    #     return 0

    """Q2:"""
    # u0t = lambda t: sin(t)
    # u1t = lambda t: 0

    """Q1:"""


    u0t = 0
    u1t = 0

    def f(x):
        """Q1:"""
        return sin(pi * x)

        #"""Q2:"""
        # return x * 0


    def g(x):
        # might be the way to find solution to Q2
        return x * 0


    L = 1.0
    T = 1.0
    beta_square = 4.0
    delta_x = 0.01
    delta_t = 0.001

    wave = WaveEquation(L, T, u0t, u1t, beta_square, delta_t, delta_x, g, f)

    wave.sigma_checker()
    # print(wave.print_matrix())

    # wave.plot_3d()

    wave.initial_condition_matrix()
    sol = wave.wave_equation_solver()
    # print(f"giving me the answer? {sol}")
    wave.plot_3d()
    wave.plot_2d()
    wave.animate()

    print(f"wave delta x: {wave.delta_x}")
    print(f"wave delta t: {wave.delta_t}")
    print(f"wave at pos 0.5, time 0.5: {sol[int(wave.Nx // 2 + 1), int(wave.Nt // 2 + 1)]}")
