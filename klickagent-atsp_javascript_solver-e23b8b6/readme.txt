- root of bachelorthesis
- tsp_solver is main solver
- htaccess redirects app/javascript/TSP_Solver.js to tsp_solver folder => worker on ios device cannot access self.location.origin (to importScript)
- generate docu: node_modules/.bin/jsdoc ./ -c ./jsdoc/conf.json

installation information
- all setup information provided assume a linux distribution
- place this folder under /var/www/html/bachelorarbeit
- nodejs must be installed (https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)
- change http://yourserver.com to your server location

attention
- html files must be opened on a webserver (e.g. localhost/..) not through the filesystem (file:///...) to run correctly