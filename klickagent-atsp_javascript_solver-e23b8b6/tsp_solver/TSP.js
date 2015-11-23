/** Problem instance (API) module:TSP.<br/>
 * useage:
 * <pre class="prettyprint">
 * var tsp_instance = new TSP(waypoints,distanceTable);
 * tsp_instance.solve(algo,mode,threadCount,function () {
 *     // Success
 * }, function (err) {
 *    // Error
 * }, function (progress) {
 *     // Progress
 * }, function(){
 *
 * });
 * </pre>
 * @module TSP_API
 */
 
 
(function(globals){
  "use strict";	
	
	//clone an object
	var clone = function( o ) {
		var i, myObj = (o instanceof Array) ? [] : {};
		for (i in o) {
			if (o[i] && typeof o[i] == "object") {
				myObj[i] = clone(o[i]);
			} else 
				myObj[i] = o[i];
			}
		return myObj;
	};
	
	//get the url of the executed script
	var scripts = document.getElementsByTagName("script"),
	    x = scripts[scripts.length-1].src.split('/'); 
	x.splice(-1,1);
	var TSP_SOLVER_DOMAIN = x.join('/');
	
	
	
	/**
	 * Represents a Traveling Salesman Problem
	 * @constructor
	 * @param {array} distanceTable - Distance table
	 * @param {array} waypoints - Waypoints array (currently not needed)
	 */
	globals.TSP = function(distanceTable,waypoints){
		
		//namespace
		var thisTSP = this;
		
		/** Stop a calculation which is in progress */
		this.stop = function(){
			this.stopped = true;
			
			if( thisTSP.mode === 'singlethread' ){
				
				/** stop worker thread */
				this.worker.postMessage({ cmd: 'stop' } );
				
			} else if( thisTSP.mode === 'server' || thisTSP.mode === 'server_multithread' ) {
			
				//todo: send command to server
				
			} else {
			
				/** stop solver imediately */
				thisTSP.solver.stop();
			}
			
		};
		
		/** 
		 * Object which holds the names of the algorithm (key=>value)
		 * @private
		 */
		this.algoNames = {
			'BruteForce': 'brute force',
			'BnB': 'branch and bound',
			'Antcolonyk2_k3': 'Ant colony and k3',
			//'Dynamic': 'dynamic',
			'Antcolonyk2': 'ant colony and k2',
			'Nearestneighbour': 'nearest neighbour',
			'Dynamic' : 'dynamic (held karp)'
		};
		
		/** mode (architecture) to solve the tsp
			* @member {string}
			* @private
		*/
		this.mode = null;
		
		/** algorithm to solve the tsp
			* @member {string}
			* @private
		*/
		this.algo = null;
		
		/** count of threads to solve the tsp
			* @member {int}
			* @private
		*/
		this.threadCount = null;
		
		/** state of the calculation
			* @member {boolean}
			* @private
		*/
		this.running = false;
		
		/** stop execution
			* @member {boolean}
			* @private
		*/
		this.stopped = false;
		
		/* detect the performance of the current client, currentyl not used 
		 * @method
		 * @protected
		*/
		this.detectPerformance = function(){
		
			window.performance = window.performance || {};
			performance.now = (function() {
			  return performance.now       ||
			         performance.mozNow    ||
			         performance.msNow     ||
			         performance.oNow      ||
			         performance.webkitNow ||
			         function() { return new Date().getTime(); };
			})();
		
		
			var time = window.performance.now(); //time in milliseconds
			for( var i = 0; i<100000000 ; i++ ){
				//iterate
			}
			var diff = window.performance.now()-time;
			//console.error(diff);
		};
		
		/* init the TSP
		 * @method
		 * @protected
		 * @param {array} distanceTable - Distance table
		 * @param {array} waypoints - Cities of waypoints (not used)
		*/
		this.init = function(distanceTable,waypoints){
			thisTSP.distanceTable = distanceTable;
			thisTSP.waypoints = waypoints;
			thisTSP._problemSize = false;
		};
		this.init(distanceTable,waypoints);
		
		/* returns the problem size of the tsp, based on the distance table
		 * @method
		 * @protected
		*/
		this.getProblemSize = function(){
			if( thisTSP._problemSize === false ){
				thisTSP._problemSize = thisTSP.distanceTable.length;
			}
			return this._problemSize;
			
		};
		
		/**
		 * Solve the TSP
		 * @param {mixed} algo - true (boolean) to autodetect best fitting algorithm for the tsp.
		 * BruteForce / BnB / Dynamic / Antcolonyk2_k3 / Nearestneighbour to solve with a specific algorithm.
		 * @param {mixed} mode - true (boolean) to autodetect best fitting execution mode.
		 * normal / singlethread / webworker / server / server_multithread / client_distributed
		 * @param {mixed} threadCount - If multithread execution mode selected, specify maximum of threads to use
		 * @param {function} successFnct - function which is called after successfull execution of the method solve
		 * @param {function} errorFnct - function which is called after an error occured and the execution of the solve method is aborted
		 * @param {function} progressFnct - function which is called when a new solution is found by the algorithm
		 */
		this.solve = function(algo,mode,threadCount,successFnct,errorFnct,progressFnct){			
		
			thisTSP.mode = mode;
			thisTSP.algo = algo;
			thisTSP.threadCount = threadCount;
			var _this = this;
			//var cores = window.navigator.hardwareConcurrency;
			
			//autodetect:
			if( !thisTSP.mode || thisTSP.mode === true ){
				var problemsize = thisTSP.getProblemSize();
				if( problemsize < 4 ){
					thisTSP.algo = 'Dynamic';
					thisTSP.mode = 'normal'; //no overhead when calculated in same thread
				/*
				no reason to calculate using different algorithms. dynamic is the fastest algo to calculate the exact solution anyway
				} else if( problemsize < 10 ){
					thisTSP.algo = 'BruteForce';
					thisTSP.mode = 'singlethread';
				} else if( problemsize < 11 ){
					thisTSP.algo = 'BnB';
					thisTSP.mode = 'webworker';
					thisTSP.threadCount = 1;*/
				} else if( problemsize < 20 ){
					thisTSP.algo = 'Dynamic';
					thisTSP.mode = 'singlethread';
				} else if( problemsize < 300 ){
					thisTSP.algo = 'Antcolonyk2_k3';
					thisTSP.mode = 'singlethread';
				/*} else if( problemsize < 100 ){
					thisTSP.algo = 'Antcolonyk2';
					thisTSP.mode = 'singlethread';
				*/
				} else {
					thisTSP.algo = 'Nearestneighbour';
					thisTSP.mode = 'singlethread';
				}
			}
			
			/** returns the algorithm name by its identifier 
				* @param {string} identifier of the algorithm
				* @private
				* @static
			*/
			var getAlgoName = function(algo){
				var n = thisTSP.algoNames[algo];
				if( typeof n !== 'undefined ' ){
					return n;
				} else {
					return algo;
				}
			};
		
		
			thisTSP.stopped = false;
			
			/** message receiver
				* @param {object} identifier of the algorithm
				* @private
			*/
			this.postMessage = function(d){
				
				if( !d.type ) d.type = 'status';
				if ( d.type === 'status' ) {
					
					progressFnct({bestTour: d.bestTour, bestTourWeight: d.bestTourWeight});
					
				} else if( d.type === 'result' ) {
					
					successFnct({
						bestTour: d.bestTour, 
						bestTourWeight: d.bestTourWeight, 
						startTour: d.startTour, 
						startTourWeight: d.startTourWeight, 
						optimization: Math.round((1-(d.bestTourWeight/d.startTourWeight))*100*100)/100, /* Math.round( xx*100) / 100 => rounding 2 decimals*/
						algo: thisTSP.algo,
						algoname: getAlgoName(thisTSP.algo),
						mode: thisTSP.mode,
						threads: thisTSP.threadCount
					});
				} else if(d.type == "console.log") {
					//console.log.apply(console, d.data);
				}
			};
		
		
			if( thisTSP.mode === 'singlethread' ){
				thisTSP.worker = new Worker(TSP_SOLVER_DOMAIN+ "/TSP_Solver.js");
				/* event listener for messaging with main thread: */
				thisTSP.worker.onmessage = function(d){
					_this.postMessage(clone(d.data));
				};
				thisTSP.worker.postMessage({ 
					cmd: 'tsp', 
					waypoints: thisTSP.waypoints, 
					distanceTable: thisTSP.distanceTable , 
					algo: thisTSP.algo, 
					mode: thisTSP.mode, 
					modeThreadC: 0
				});
			
			} else {
				
				//adjust thread count if too many sent:
				if(mode === 'webworker' ){
					/*if( thisTSP.threadCount == 1 ){
						thisTSP.threadCount = (thisTSP.distanceTable.length-1);
						console.error( 'thread count adjusted to',thisTSP.threadCount);
					}
					*/
					if(thisTSP.threadCount){
						if( thisTSP.threadCount > (thisTSP.distanceTable.length-1) ){
							thisTSP.threadCount = (thisTSP.distanceTable.length-1);
							console.error( 'thread count adjusted to',thisTSP.threadCount);
						}
					}
				}
				
				if( mode === 'server' || mode === 'server_multithread' ){
					//ajax request to server:
					$.ajax({
						dataType: "jsonp",
						type: "post",
					  	url: "http://yourserver.com:8001",
					  	data: { 
					  		cmd: 'tsp', 
					  		waypoints: JSON.stringify(thisTSP.waypoints), 
					  		distanceTable: JSON.stringify(thisTSP.distanceTable) , 
					  		algo: thisTSP.algo, 
					  		mode: thisTSP.mode, 
					  		modeThreadC: thisTSP.threadCount
					  	},
					  	success: function(d){
					  		_this.postMessage(d);
					  	},
					  	error: function(e){
					  		alert('hui');
					  		e.error = true;
					  		_this.postMessage(e);
					  	}
					});
				} else {
					thisTSP.solver = globals.solve_tsp_helper_function(this,thisTSP.waypoints,thisTSP.distanceTable,thisTSP.algo,thisTSP.mode,thisTSP.threadCount);
				}	
			}
		
			
			return this;
		};
	};
	
	
}(this));