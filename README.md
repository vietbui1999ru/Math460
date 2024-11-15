# This is a Lab project in my Math Senior Inquiry Class for Heat Equation Modelling

---

## Features

- Abstracted the Model with OOP to support inputting user-defined equations
  (user have to go into main_test.py and change the functions
  and conditions themselves)
- Provides 3 modelling plots (3D, 2D, and an Animation of model
  changes over time)

### Heat Equation Modelling

- To run, go to the main_test.py file and run the script on the terminal
  (ensure that the imports are on your machine).
- In main_test.py, if you want to change
  the initial conditions, boundary conditions, beta, delta_t, delta_x,
  length of rod, etc, refer to large comments instructing to do so.
- If you want to change running condition for sigma
  (if CFL is wrong, the program automatically exits),
  then go to line 50 and comment out exit()
- Press Y/N to choose whether you want to plot animation of the rod's heat changes.

### Wave Equation Modelling

- To run Q1, go to the wave_eq.py file and run the script on the terminal,
  the model will show 3D -> 2D -> Animation as you close the plot windows
  one at a time (ensure that the imports are on your machine).
- To change model scale, go to line 177 - 178 and change the
  delta_t and delta_x values.
- To run Q2, go to the wave_final.py file and run the script on the terminal,
  the model will show 3D -> 2D -> Animation as you close the plot windows
  one at a time (ensure that the imports are on your machine).
- To change model scale, go to line 18 - 19 and change the delta_t and delta_x values.

---

### To-dos

- [ ] Add parser for user function input.
- [ ] Add TUI for user to change functions from the command-line.
- [ ] Add GUI for persistent and fluid simulation instances.
