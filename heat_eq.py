from pylab import *


class HeatEquation(object):
    def __init__(self, L, T, b0t, b1t, beta, delta_t, delta_x, u_0):
        # initial and boundary condition
        self.L = L
        self.T = T
        self.b0t = b0t
        self.b1t = b1t
        self.beta = beta
        self.delta_t = delta_t
        self.delta_x = delta_x
        self.u_0 = u_0
        # length of time array
        self.len_t = int((self.T / self.delta_t) + 1)
        #self.N = int((self.L / self.delta_x) + 1)
        self.N = int((self.L / self.delta_x) + 1)
        self.sigma = self.beta * self.delta_t / (self.delta_x ** 2)
        # self.sigma_checker()
        # create tri-diagonal matrix
        self.A = self.create_tri_diag()
        # create u vector for u_0 initial condition
        # create u vector for boundary condition
        self.u = self.initial_condition_vector()
        self.u_bound = np.zeros(self.N)
        # set boundary condition
        self.u_bound[0] = self.b0t
        self.u_bound[self.N - 1] = self.b1t
        # create u matrix
        self.u_matrix = np.zeros((self.N, self.len_t + 1))
        self.u_matrix = self.heat_equation_solver()

    def initial_condition_vector(self):
        u = np.zeros(self.N)
        for i in range(0, self.N):
            u[i] = self.u_0(i, self.delta_x)
        return u

    def print_initial_condition_vector(self):
        return f"init condition vector = {self.u}"

    def sigma_checker(self):
        if self.sigma < 0.5:
            return f"sigma = {self.sigma} < 0.5 => The model should work"
        else:
            print(f"sigma = {self.sigma} >= 0.5 => The model doesn't work")
            exit()

    def create_tri_diag(self):
        n = self.N
        A = np.zeros((n, n))
        for i in range(n):
            if i == 0:
                A[i][i + 1] = self.sigma
            elif i == n - 1:
                A[i][i - 1] = self.sigma
            else:
                A[i][i + 1] = self.sigma
                A[i][i - 1] = self.sigma
            A[i][i] = 1 - 2 * self.sigma
        A[0,:] = 0
        A[0, 0] = 1
        A[n - 1, :] = 0
        A[n - 1, n - 1] = 1
        return A

    def print_tri_diag(self):
        return f"A tri-diagonal = \n {self.A}"

    def heat_equation_solver(self):
        # set initial condition into the matrix
        # have to go back and check the 0 if it should be 1 or not
        self.u_matrix[:, 0] = self.u
        self.u_matrix[0, :] = self.u_bound[0]
        self.u_matrix[self.N - 1, :] = self.u_bound[self.N - 1]

       # print("final u vector: ", self.u)
       # print(f"u bound vector: {self.u_bound}")
       # print(f"u matrix shape: {self.u_matrix.shape}")
       # print(f"u matrix initial: {self.u_matrix[:, 0]}")
        # calculate u vector at each time step
        for i in range(0, self.len_t):
            #self.u_matrix[:, i + 1] = np.dot(self.A, self.u_matrix[:, i]) + self.delta * self.u_bound
            self.u_matrix[:, i + 1] = np.dot(self.A, self.u_matrix[:, i]) 
            #print(f"u matrix at time step {i}: {self.u_matrix[:, i]}")
            #time.sleep(0.8)

        # set boundary condition into the matrix
        for i in range(0, self.len_t):
            self.u_matrix[0, i] = self.u_bound[0]
            self.u_matrix[self.N - 1, i] = self.u_bound[self.N - 1]
        return self.u_matrix

    def print_u_matrix(self):
        return f"u matrix = \n {self.u_matrix}"

    def return_u_matrix(self):
        return self.u_matrix
