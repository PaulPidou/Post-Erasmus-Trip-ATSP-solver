# Javascript ATSP solver (asynchronous travelling salesman problem solver)
##Project
For my bachelor thesis I programmed an atsp problem solver. The idea behind the solver is to solve the problem in the browser, using the latest browsertechnologies available (eg. Webworkers, Websockets). In this repository you can find the final solution and the bachelorthesis in german.

##Demo
To see this content in action, visit http://ba.klickagent.ch

## Min requirements
- Webserver
- Browser whith webworker support

##Full requirements
To get the solver working completely with all its options a dedicated webserver is needed. This server acts as a messaging server and can be used for solving the problem as well
- Dedicated webserver, where you can install nodejs

##Used algorithms
- Branch and Bound (BnB)
- Dynamic
- Brute force
- K3
- Ant colony
- Nearest neighbour

##Links
- https://github.com/klickagent/atsp_javascript_solver
- http://maps.klickagent.ch

## Additional information


- tsp_solver is main solver
- htaccess redirects app/javascript/TSP_Solver.js to tsp_solver folder => worker on ios device cannot access self.location.origin (to importScript)
- generate docu: node_modules/.bin/jsdoc ./ -c ./jsdoc/conf.json

installation information
- all setup information provided assume a linux distribution
- place this folder under /var/www/html/ba_thesis
- nodejs must be installed (https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)
- change http://yourserver.com to your server location

attention
- html files must be opened on a webserver (e.g. localhost/..) not through the filesystem (file:///...) to run correctly
