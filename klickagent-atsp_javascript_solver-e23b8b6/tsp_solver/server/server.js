/* installation:

• install nodejs
• start server (run command in terminal): node pathToThisFile
• Server is available under: yourserverIP:8001 / serverdomain:8001

*/


//http://stackoverflow.com/questions/4295782/how-do-you-extract-post-data-in-node-js


var http = require('http'),
	querystring = require('querystring'),
	url = require('url');

function processPost(request, response, callback) {
    var queryData = "";
    if(typeof callback !== 'function') return null;

    if(request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            request.post = querystring.parse(queryData);
            callback();
        });

    } else if(request.method=='GET') {
         var url_parts = url.parse(request.url,true);
         request.get = url_parts.query;
         callback();
     } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }
}




http.createServer(function(request, response) {
        processPost(request, response, function() {
            
            
            if(request.method == 'POST') {
	            //request cmd tsp:
	           performTSP(request,response,request.post);
	            
	         } else if(request.method == 'GET') {
		         performTSP(request,response,request.get);
		         
		         
            }
            // Use request.post here       
        });
    
}).listen(8001);


var performTSP = function(request,response,params){
	if( params.cmd === 'tsp' ){
		
		if( params.mode === 'server' ){
		//mode server singlethreaded:
		
			var TSP_Solver_Worker_ns = require('../TSP_Solver_Worker')();
			var TSP_Solver_ns = require('../TSP_Solver')(TSP_Solver_Worker_ns);
		} else {
			//server_multithreaded:
			
			var cp = require('child_process');
			var TSP_Solver_Worker_ns = require('../TSP_Solver_Worker')(cp);
			var TSP_Solver_ns = require('../TSP_Solver')(TSP_Solver_Worker_ns);
		}
		
		var tsp_solver = new TSP_Solver_ns.TSP_Solver();
		
		/*console.log(params.waypoints);
		var waypoints = (typeof params.waypoints === 'object' ) ? params.waypoints : JSON.parse(params.waypoints);
		var distanceTable = (typeof params.distanceTable === 'object' ) ? params.distanceTable : JSON.parse(params.distanceTable);
		*/
		if( typeof params.distanceTable === 'undefined' ){
			console.log('error, no distance table provided');
			params.distanceTable = '{}';
		}
		if( typeof params.waypoints === 'undefined' ){
			params.waypoints = '{}';
		}
		tsp_solver.addCities(JSON.parse(params.distanceTable,JSON.parse(params.waypoints)));
		
		/*tsp_solver.registerEvent('onSolutionFound',function(){
			postMessage({type: 'status', bestTourWeight: tsp_solver.bestTourWeight, cities: tsp_solver.cities, bestTour: tsp_solver.bestTour, params: params});
		});
		*/
		
		tsp_solver.registerEvent('onSuccess',function(){
			console.log('finishing');
			response.writeHead(200, {'Content-Type': 'application/json'});
			//response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
			
			var result_text = JSON.stringify(
				{
					type: 'result',
					cities: tsp_solver.cities, 
					bestTourWeight: tsp_solver.bestTourWeight,
					bestTour: tsp_solver.bestTour, 
					startTourWeight: tsp_solver.startTourWeight,
					startTour: tsp_solver.startTour, 
					optimization: tsp_solver.optimization,
					params: ''
				}
			);
			if( params.callback ){
				response.write(params.callback + '(' + result_text + ')');
			} else {
				response.write(result_text);
			}
			
			response.end();
		
		});
		params.modeThreadC = parseInt( params.modeThreadC );
		if( isNaN(params.modeThreadC) )
			params.modeThreadC = 0;
		
		console.log('solving',params.algo,params.mode,params.modeThreadC);
		tsp_solver.solve(params.algo,params.mode,params.modeThreadC);
		
	} else {
		//501 => service not implemented:
		response.writeHead(501, "OK", {'Content-Type': 'text/plain'});
		response.end('no cmd sent');
	}
};

/*
//http://stackoverflow.com/questions/12006417/nodejs-server-that-accepts-post-requests

http = require('http');
fs = require('fs');
server = http.createServer( function(req, res) {

    console.dir(req.param);

    if (req.method == 'POST') {
        console.log("POST");
        var body = '';
        req.on('data', function (data) {
            body += data;
            console.log("Partial body: " + body);
        });
        req.on('end', function () {
            console.log("Body: " + body);
        });
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('post received');
    }
    else
    {
        console.log("GET");
        //var html = '<html><body><form method="post" action="http://localhost:3000">Name: <input type="text" name="name" /><input type="submit" value="Submit" /></form></body>';
        var html = '<html><body>welcome to tsp server</body>';
        //var html = fs.readFileSync('index.html');
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html);
    }

});

port = 8001;
server.listen(port);
console.log('Listening under '+ port);*/