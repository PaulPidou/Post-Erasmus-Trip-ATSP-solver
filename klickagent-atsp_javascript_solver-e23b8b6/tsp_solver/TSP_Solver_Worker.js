/** The TSP_Solver_Worker Module module:TSP_Solver_Worker.
 * @module TSP_Solver_Worker
 */
(function(globals){
  "use strict";
	
	if( typeof module !== 'undefined' ){
		var MODE = 'node';
		var cp = null;
		//var TSP_Solver_Worker get defined by require the js file
	} else if(typeof window === 'undefined' ){ 
		var MODE = 'webworker';
		//var TSP_Solver_Worker = globals;
		
		//var x = (globals.location.origin+globals.location.pathname).split('/'); 
		//x.splice(-1,1);
		//var TSP_SOLVER_DOMAIN = x.join('/');
		//console.error(TSP_SOLVER_DOMAIN);
		
	} else {
		var MODE = 'normal';
		//var TSP_Solver_Worker = globals;
		
		var scripts = document.getElementsByTagName("script"),
		    x = scripts[scripts.length-1].src.split('/'); 
		x.splice(-1,1);
		var TSP_SOLVER_DOMAIN = x.join('/');
		//console.error(TSP_SOLVER_DOMAIN);
	}
	
	/* core functions */
	//uuid
	var uuid = function() {
		var s4 = function() {
			return Math.floor((1 + Math.random()) * 0x10000)
								.toString(16)
								.substring(1);
		};
		return s4() + s4() + '-' + s4();
		//+ '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	};
	
	var workerID = uuid();
	//clone obj / array:
	/* this kills Infinity values: */
	/*var clone = function(o){
		return JSON.parse( JSON.stringify( o ) );
	};
	var clone = function(o){
		return [o].splice(0, 1);
	};
	*/
	var clone = function( o ) {
		var i, myObj = (o instanceof Array) ? [] : {};
		for (i in o) {
			//if (i != 'clone') {
			if (o[i] && typeof o[i] == "object") {
				myObj[i] = clone(o[i]);
			} else 
				myObj[i] = o[i];
			} 
			//}
		return myObj;
	};
	
	var objectsize = function(obj) {
	    var size = 0, key;
	    for (key in obj) {
	        if (obj.hasOwnProperty(key)) size++;
	    }
	    return size;
	};

	/*if( MODE === 'webworker' ){
		
		console.log = function(){ 
			//postMessage({cmd: 'console.log', content: Array.prototype.slice.call(arguments)}); 
		};
		/*var console = {
			log: function() {
				//postMessage({cmd: 'console.log', content: Array.prototype.slice.call(arguments)});
			}
		}; * /
		//console.log('new webworker started');
	}
	*/
	
	/** the tsp problem itself with the distance matrix
		* @constructor
		* @protected
		* @class tsp
	*/
	globals.tsp = function(restore){
	
		/** serialize current tsp problem, for sending to worker / client
			* @function
			* @protected
		*/
		this.save = function(){
			return {
				dist: this.dist,
				distCount: this.distCount,
				path: this.path,
			};
		};
		
		/** deserialize current tsp problem, for restoring a node by its values (previously serialized via store method)
			* @function
			* @protected
		*/
		this.restore = function(data){
			var i;
			for( i in data ){
				this[i] = data[i];
			}
		};
		
		/** add distance to tsp
			* @function
			* @param {array} distanceTable - Distance table
			* @protected
		*/
		this.addDistances = function(distanceTable){
			this.dist = distanceTable;
			this.distCount = distanceTable.length;
			var i, tourLength=0;
			for( i = 0; i < this.distCount ; i++ ){
				this.dist[i][i] = Infinity;
				this.path.push( i );
				tourLength += this.dist[i][(i+1) % this.distCount];
			}
			this.tourLength = tourLength;
		};
	
		
		/* init */ 
		if( restore ){
			this.restore(restore);
		} else {
			//cities and its w to eachother:
			this.dist = [];
			
			//path of route (only number of city)
			this.path = [];
			this.distCount = 0;
		}
	
	};
	
	/** Represents a node calculator (handling queues etc.)
		* @constructor
		* @protected
		* @class TSP_Solver_Worker
	*/
	globals.TSP_Node_Calc = function(){
	
		/** holds the best tour
			* @member {array}
			* @protected
		*/
		this.bestTour = null;
		/** holds the best tour weight
			* @member {integer}
			* @protected
		*/
		this.bestTourWeight = null;
		
		/** all workers if main thread
			* @member {object}
			* @protected
		*/
		this.workers = {};
		
		/** all worker_ids in an array
			* @member {array}
			* @protected
		*/
		this.workers_index = [];
		
		/** counter for how many nodes are assigned to one webworker
			* @member {integer}
			* @protected
		*/
		this.processingNodeCount = false;
		
		this.tsp = null;
		
		/** solver instance ({@link TSP_Solver} of app to write back the results
			* @member {TSP_Solver}
			* @protected
		*/
		this.solver = null;
	
		this.setProcessingNodeCount = function(val){
			//set first value only:
			if( this.processingNodeCount === false ){
				this.processingNodeCount = val;
			}/* else {
				this.processingNodeCount += val;
			}*/
			//console.error(workerID+' to',this.processingNodeCount);
		};
	
		/** stop calculation of the calculation (all workers)
			* @method
		*/
		this.stop = function(){
			this.solver.stopped = true;
			this.stopWorkers();
		};
	
		/*	* holds the tree structure
			* Initialize the priority queue (PQ)
			* @member {priorityQueue}
			* @protected
		*/
		this.priorityQueue = new priorityQueue();
	
		/** all worker_ids in an array
			* @method
			* @protected
			* @param {object} tsp_data - serialised data of a tsp instance
			* @param {object} node_data - serialised data of a node instance
			* @param {integer} bestTourWeight - 
			* @param {integer} calculationMode - 
			* @param {integer} calculationModeThreadMax - 
			* @param {integer} solver - 
			* @param {kowal q deferred object} distributedDeferred - deferred object if distribution over multiple clients is used
		*/
		//solver is only available if called from TSP_Solver.js file => not in webworker / distributed client!
		this.processNode = function(tsp_data,node_data,bestTourWeight,calculationMode,calculationModeThreadMax,solver,distributedDeferred){
			
			var _this = this, l, newNode, newpt, i,
				worker, modCount,
				nodes_per_thread, to_distribute;
			
			//only the first time the processNode is executed
			if( this.tsp === null ){
				this.addNewLowerBoundAndTour( bestTourWeight, null );
				
				this.solver = solver;
				this.tsp = new globals.tsp(tsp_data);
			}
			//console.error(bestTourWeight,JSON.stringify(node_data));
			this.priorityQueue.add( new globals.node(this.tsp ,node_data) );
			
			//decrease node counter, to detect termination of the TSP_Solver_Worker, when multiple nodes are assigned
			_this.processingNodeCount--;
			
			//create a message object to be returned later
			var sendCommand = { cmd: 'nlb', 'lb': '', 'tour': '' };
			var fnct_end = function(){
				//if stopped and in main thread => send stop signal to webworker!
				if( _this.solver.stopped && ((MODE === 'normal' && calculationMode === 'webworker') || (calculationMode === 'server_multithread' && cp !== null )) ){
					_this.stopWorkers();
				}
				if( calculationMode === 'normal' || calculationMode === 'singlethread' || calculationMode === 'server' ){
					
					_this.writeSolutionBackToSolver();
				} else if( MODE === 'webworker' || (calculationMode === 'server_multithread' && cp === null ) || ( calculationMode === 'client_distributed' && distributedDeferred ) ){
					
					//decrease per thread counter:
					if( _this.processingNodeCount === 0 ){
						//console.log('finished');
						
						if( calculationMode === 'client_distributed' && distributedDeferred ){
							//console.error('resolve!?');
							distributedDeferred.resolve();
							
						} else if( MODE === 'node' ){
							console.log('process finished');
							process.send({ cmd: 'finishCalculation' } );
							//clean up after process ended:
							process.exit();
						} else {
							globals.postMessage( { cmd: 'finishCalculation' } );
							//close webworker:
							globals.close();
						}
						
						
					}
				}
			};
			
			var distributedParameters=[];
			
			var fnct = function(){
				//console.log( 'log size',_this.priorityQueue.getQueueLength() );
				
				
				_this.nextNode = _this.priorityQueue.first();
				//console.log( JSON.stringify( _this.nextNode ) );
				
				if( _this.nextNode.ptl == _this.tsp.distCount && _this.nextNode.lowerBound() < _this.bestTourWeight ) {
					
					
					//console.log('evaluate new full branch');
					_this.bestTourWeight = _this.nextNode.lowerBound();
					_this.bestTour = _this.nextNode.nodePath();
					//_this.bestNode = _this.nextNode;
					
					//run hook:
					if( calculationMode === 'client_distributed' && distributedDeferred ){
						
						
						sendCommand.lb = _this.bestTourWeight;
						sendCommand.tour = _this.bestTour;
						//notify deferred:
						distributedDeferred.notify(sendCommand);
					
					} else if( MODE === 'normal' || calculationMode === 'normal' || calculationMode === 'singlethread' || calculationMode === 'server' ){
						_this.solver.hooks.onSolutionFound();
						
					//no mode sharing 	
					} else {
						
						sendCommand.lb = _this.bestTourWeight;
						sendCommand.tour = _this.bestTour;
						
						if( MODE === 'node' ){
							process.send(sendCommand);
						} else {
							//send to main thread which will distribute it to all workers
							globals.postMessage(sendCommand);
						}
						
						//send to main client which will distribute it to all other clients
					}
	
				}
				
				_this.priorityQueue.remove( _this.nextNode );
				
				//console.log( 'log size',_this.priorityQueue.getQueueLength() );
				//console.log( 'compare', _this.nextNode.lowerBound(), _this.bestTourWeight );
				if( _this.nextNode.lowerBound() < _this.bestTourWeight ){
					
					// create sub nodes for this node:
					l = _this.nextNode.l+1;
					
					if(calculationModeThreadMax){
						nodes_per_thread = Math.floor((_this.tsp.distCount-1)/calculationModeThreadMax);
						to_distribute = (_this.tsp.distCount-1) - ( nodes_per_thread*(calculationModeThreadMax));	
					}
					//for( i in _this.tsp.dist ){
					for( i = 0 ; i < _this.tsp.distCount ; i++ ){
						//i = parseInt(i);
						//console.log('is',i,'inside', _this.nextNode.pt, _this.nextNode.pt.indexOf ( i ));
						if( _this.nextNode.pt.indexOf ( i ) === -1 ){
							
							//create new node, add pt (of current node) and add the new city:
							newpt = clone(_this.nextNode.pt);
							newpt.push(i);
							
							newNode = new globals.node(_this.tsp,false,	newpt, l);
							//console.log(newpt);
							//console.log('create new node',newNode.pt);
							
							
							if( calculationMode === 'normal' || MODE === 'webworker' || calculationMode === 'server' || (calculationMode === 'server_multithread' && cp === null ) || ( calculationMode === 'client_distributed' && distributedDeferred ) ){
								
								//if in webworker add to priority Queue, to process all subnodes:
								_this.priorityQueue.add( newNode );
							
							} else if( calculationMode === 'client_distributed' ){
							
								
								distributedParameters.push({ cmd: 'processNode', tsp: _this.tsp.save(), node: newNode.save() , bestTourWeight: _this.bestTourWeight, modCount: 1,calculationMode: calculationMode });
								
							//if in main script => assign webworkers for the generated nodes:
							} else {
							
								if( calculationModeThreadMax ){
									if( to_distribute > 0 ){
										to_distribute--;
										modCount = nodes_per_thread + 1;
									} else {
										modCount = nodes_per_thread
									}
								} else {
									modCount = 1;
								}
							
								if( calculationModeThreadMax && _this.workers_index.length === calculationModeThreadMax ){
									
									//console.error('add to',_this.workers_index[(i-1)%(calculationModeThreadMax)] );
									worker = _this.workers[ _this.workers_index[(i-1)%(calculationModeThreadMax)] ];
									
									//modCount = 0;
									
								} else {
									/* distribute this to webworker or other client depending on mode of execution*/
									//https://code.google.com/p/chromium/issues/detail?id=31666
									
									
									//call inside function to encapsulate worker_id inside the for loop:
									worker = _this.spawnThread( calculationMode, uuid() );
									//console.error('spawn new worker',calculationModeThreadMax,_this.workers_index.length);
									
									//console.error(modCount);
									//console.log( worker );
								}
								//console.error(newNode.lowerBound());
								//console.error(modCount);
								if( MODE === 'node' ){
									worker.send({ cmd: 'processNode', tsp: _this.tsp.save(), node: newNode.save() , bestTourWeight: _this.bestTourWeight, modCount: modCount, calculationMode: calculationMode });
								} else {
									worker.postMessage({ cmd: 'processNode', tsp: _this.tsp.save(), node: newNode.save() , bestTourWeight: _this.bestTourWeight, modCount: modCount,calculationMode: calculationMode });
								}
								/*  i:i */
								//console.error('send message',i);
							}
							
							
							
						}
						
					}/* end for */
					
					if( calculationMode === 'client_distributed' ){
						var distributedSystem = initDistributedSystem(_this);
						distributedSystem.startJob(objectsize(distributedParameters),'processNode',distributedParameters);
					}
					
				} else {
					//console.error('prune');
					delete( _this.nextNode );
				}
						
				if( !_this.solver.stopped && _this.priorityQueue.getQueueLength() > 0 ){	
					setTimeout(fnct,0); 
				} else {
					fnct_end();
				}
			};
			
			//start:
			fnct();
			
			
		};
		
		/** stop workers
			* @function
			* @protected
		*/
		this.stopWorkers = function(){
			for( var i in this.workers ){
				var worker = this.workers[i];
				if( MODE === 'node' ){
					worker.send({ cmd: 'stop' });
				} else {
					worker.postMessage({ cmd: 'stop' } );
				}
			}
		};
		
		/** write solution nback to the initiation TSP_Solver object
			* @function
			* @protected
		*/
		this.writeSolutionBackToSolver = function(){
			//console.log('write solution back to solver');
			if( this.bestTour !== null ){
				this.solver.bestTour = this.bestTour;
				this.solver.bestTourWeight = this.bestTourWeight;
			}
			//run hook:
			this.solver.hooks.onSuccess();
		};
		
		
		/** span a thread (webworker) / process (nodejs)
			* @function
			* @param {string} calculationMode - Mode of calculation
			* @param {integer} worker_id - id of the worker / process id
			* @protected
		*/
		this.spawnThread = function(calculationMode,worker_id){
		
			//encapsulate this.workers to be available inside the onmessage callback function:
			var _this = this;
			
			this.workers_index.push(worker_id);
			
			/* event listener for messaging with main thread: */
			var callback = function(data){
				switch (data.cmd) {
					
					case 'nlb':
						
						//console.error('new lower bound received',data.lb);
						//add new found lowerbound to solution
						_this.addNewLowerBoundAndTour(data.lb,data.tour);
						
						//send newLowerBound to all webworkers
						var _id;
						for( _id in _this.workers ){
							if( MODE === 'node' ){
								_this.workers[_id].send(data);
							} else {
								_this.workers[_id].postMessage(data);
							}
						}
						
					break;
					
					
					case 'finishCalculation':
						//remove this webworker from webworkers => because it is finished
						_this.workers[worker_id] = undefined;
						delete _this.workers[worker_id];
						
						
						//if all webworkers removed => problem solved and result is sent to main thread
	
						if( objectsize( _this.workers ) === 0 ){
							_this.writeSolutionBackToSolver();
						}
						
					
					break;
					
					case 'console.log':
						//console.log('from worker');
						console.log.apply(console, data.content);
					break;
					
					default:
						//globals.postMessage('Unknown command: ' + data.msg);
						
					break;
				}
			};
			
			
			if(MODE === 'node'){
				console.log('fork');
				this.workers[worker_id] = cp.fork(__dirname + '/TSP_Solver_Worker.js' );
				this.workers[worker_id].on('message',callback);
			} else {
				this.workers[worker_id] = new Worker( TSP_SOLVER_DOMAIN + '/TSP_Solver_Worker.js#'+worker_id);
				this.workers[worker_id].onmessage = function(e){
					callback(e.data);
				}
			}
			
			//this.workers[worker_id].postMessage({ cmd: 'processNode', tsp: this.tsp.save(), node: '' , bestTourWeight: this.bestTourWeight} );
			
			return this.workers[worker_id];
	
		};
		
		this.addNewLowerBoundAndTour = function( lowerbound, tour ){
			if( this.bestTourWeight === null || this.bestTourWeight > lowerbound ) {
				this.bestTourWeight = lowerbound;
				this.bestTour = tour;
			}
		};
		
		
	};
	

	
	/* all the nodes in the state space: */
	globals.node = function(tsp, restore, pt, l) {
		
		/* 	pt = partialTour 
			ptl = partialTourLength
			l = level
			lb = lowerBound
		*/
		
		//for sending to worker / client:
		this.save = function(){
			return {
				id: this.id,
				pt: this.pt,
				ptl: this.ptl,
				_lb: this._lb,
				l: this.l
			};
		};
		
		//for restore a node by its values (previously exported via store method)
		this.restore = function(data){
			var i;
			for( i in data ){
				this[i] = data[i];
			}
		};
		
	
		this.nodeWeight = function() {
			return this.getTour().weight;
		};
		this.nodePath = function(){
			return this.getTour().path;
		};
	
		this.getTour = function() {
			
			if( this._tour !== false ) {
				return this._tour;
			}
			
			var tour = [];
			var weight = 0;
			var cities = ( this.l === 1 ) ? this.tsp.path : this.pt;
			
			var i;
			for( i in cities) {
				i = parseInt(i);
				weight += this.tsp.dist[ cities[i] ][ cities[ (i+1) % cities.length ]];
			}
			this._tour = {path: cities, weight: weight};
			
			return this._tour;
		};
	
		this.lowerBound = function() {
		
			if( this._lb !== false ) {
				return this._lb;
			}
			
			var lb = 0,
				tsp = this.tsp,distCount = tsp.distCount,
				min, i,j,
				index,to,w,sfnct = function (a,b) {
						return a - b;
				};
				
			for( i=0 ; i<distCount;i++) {
				min = false;
				w = tsp.dist[i].slice();// slice does already clone! clone();
				
				//city in pt, min = this:
				index = this.pt.indexOf( i );
				
				//use weight if contained in pt:
				if( tsp.distCount === this.ptl || ( index !== -1 && index+1 !== this.ptl ) ) {
					to = (index+1)%this.ptl;
					min = w[ this.pt[to] ];
					
					//console.log( 'min from ' + i + ' to ' + this.pt[to] ,'is', min);
					
				} else {
				
					if( this.l !== 1 ){
						/* Don't travel to excludes */
						//console.log( i, w );
						for( j = 0; j < this.ptl ; j++ ){
							to = (j+1);//%this.ptl;
							if ( to < this.ptl ){
								w[this.pt[to]] = Infinity;
							}
						}
						if( i == this.pt[this.ptl-1]){
							w[0] = Infinity;
						}
						//console.log(i, w );
					}
					if(w.length > 1) {
						w.sort(sfnct);
					}
					min = w[0];
					//console.log( 'min of', w,'is', min);
					
				}
				
				lb += min;
				
			}
			this._lb = lb;
			return lb;
		};
		
		
		/* init: */
		this.tsp = tsp;
		
		if( restore ){
		
			this.restore(restore);
		
		} else {
		
			this.id = uuid();
			
			this.pt = pt;
			this.ptl = pt.length;
			
			this.l = l;
			
			//cache:
			this._lb = false;
			
		}
		
		//caches:
		this._tour = false;
		
	};
	
	var priorityQueue = function(){

		//represents queue (ids of elements)
		this.queue = [];
		
		//content behind every id:
		this.elements = {};
		
		//add element to queue:
		this.add = function(elem){
			//console.log( 'add', elem.id);
			this.elements[elem.id] = elem;
			this.queue.push(elem.id);
			this.queue.sort( this.sort );
			
		};
		
		var _this = this;
		
		//sort:
		this.sort = function( aID, bID ){
			if (aID == bID) {
				return 0;
			}
			
			var a = _this.elements[aID],
				b = _this.elements[bID],
				i;
			
			if (a.ptl < b.ptl) {
				return 1;
			} else if (a.ptl > b.ptl) {
				return -1;
			} else if (a.ptl == b.ptl) {
				if (a.lowerBound() < b.lowerBound()) {
					return -1;
				} else if (a.lowerBound() > b.lowerBound()) {
					return 1;
				} else if (a.lowerBound() == b.lowerBound()) {
					// Add up the sum of the cities
					var sumThis = 0;
					for ( i = 1; i <= a.ptl; i++) {
						sumThis += a.pt[i];
					}
					var sumOther = 0;
					for ( i = 1; i <= b.ptl; i++) {
						sumOther += b.pt[i];
					}
					if (sumThis <= sumOther) {
						return -1;
					} else if (sumThis > sumOther) {
						return 1;
					}
				}
			}
			return 100;
		};
		
		
		//remove element from queue:
		this.remove = function(elem){
			var index = this.queue.indexOf(elem.id);
			//console.log( 'remove', elem.id, index);
			
			this.queue.splice(index, 1);
			delete(this.elements[elem.id]);
			
		};
		
		this.getQueueLength = function(){
			return this.queue.length;
		};
		
		this.first = function(){
			var elementId = this.queue[0];
			//console.log( 'get first element' , elementId );
			return this.elements[elementId];
		};	
	};
	
	
	var initDistributedSystem = function(_this){
		if( typeof distributedSystem === 'undefined' ){
			console.error('distributedSystem not installed');
			return;
		}
		distributedSystem.addJob( 'processNode',{
			initMaster: function(ds){
				ds.logger = function(txt,replace){
					if( replace ){
						document.getElementById('log_distributed').innerHTML=txt+'<br/>';
					} else {
						document.getElementById('log_distributed').innerHTML+=txt+'<br/>';
					}
				};
				ds.logger('',true);
			},
			initSlave: function(ds){
				ds.logger = function(txt,replace){
					if( replace ){
						document.getElementById('log_distributed').innerHTML=txt+'<br/>';
					} else {
						document.getElementById('log_distributed').innerHTML+=txt+'<br/>';
					}
				};
				ds.logger('<br/>new job');
			},
			unavailable: function(ds){
				ds.logger('distributed system not available');
			},
			
			start: function(ds,data){
				var deferred = Q.defer();
				ds.logger('start calculation on distributed system');
				
				ds.calculator = new TSP_Node_Calc();
				
				ds.calculator.setProcessingNodeCount(data.modCount);
				//console.error(JSON.stringify(data));
				var solverMock = {stopped:false};
				
				ds.calculator.processNode(data.tsp,data.node,data.bestTourWeight,data.calculationMode,false,solverMock,deferred);
				
				return deferred.promise;
				
			},
			sharedData: function(ds,data){
				ds.logger('shared data received from master');
				if( !data.lb )return;
				ds.calculator.addNewLowerBoundAndTour(data.lb,data.tour);
			},
			sharedDataOnMaster: function(ds,data){
				ds.logger('shared data received from slave, redistributing to slaves');
				if( !data.lb )return;
				_this.addNewLowerBoundAndTour(data.lb,data.tour);
			},
			jobPartEnd: function(ds){
				ds.logger('slave finished');
			},
			jobEnd: function(ds){
				ds.logger('job finished');
				_this.writeSolutionBackToSolver();
			},
			slaveAcquired: function(ds,data){
				ds.logger('slave acquired '+data.sender_id);
			}
			
			
		});
		return distributedSystem;
	};
	
	if( MODE === 'normal' ){
		initDistributedSystem();
	}
	
	var callbackOnMessage = function(solverMock,data){
	
		switch (data.cmd) {
		
			case 'processNode':
				
				calculator.setProcessingNodeCount(data.modCount);
				//console.error(JSON.stringify(data));
				calculator.processNode(data.tsp,data.node,data.bestTourWeight,data.calculationMode,false,solverMock);
			break;
			
			
			case 'stop':
				
				
				solverMock.stopped = true;
				
			break;
			
			//new lowerBound
			case 'nlb':
				
				calculator.addNewLowerBoundAndTour(data.lb,data.tour);
			break;
			
			default:
				//globals.postMessage('Unknown command (in TSP_Solver_Workers.js): ' + data.msg);
			break;
		};
	};
	
	var solverMock = {stopped:false};
	
	if( MODE === 'webworker' && typeof globals.insideWebworker === 'undefined' ){
		
		var calculator = new TSP_Node_Calc();
		
		/* event listener for messaging with workers */
		globals.addEventListener('message', function(e) {
			callbackOnMessage(solverMock,e.data);
		}, false);
	
	
	
	} else if( MODE === 'node' ){
	
		var calculator = new globals.TSP_Node_Calc();
		
		process.on('message', function(data) {
			callbackOnMessage(solverMock,data);
		});
		
		module.exports = function(_cp) { 
			cp = _cp;
		   return {
			  tsp: globals.tsp,
			  TSP_Node_Calc: globals.TSP_Node_Calc,
			  node: globals.node
			};
		};
		
		
	}
	
}(this));