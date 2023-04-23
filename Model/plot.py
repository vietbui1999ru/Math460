import numpy
from pylab import * 
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

class Plot:
    def __int__(self):
        pass

    def plot_3d(self, x, y, z):
        fig = plt.figure()
        ax = fig.gca(projection='3d')
        ax.plot_trisurf(x, y, z, cmap=plt.cm.viridis, linewidth=0.2)
        plt.show()

