'use strict';
//core functions:

/** The distributedSystem Module module:distributedSystem.
 * @module DistributedSystem
 */
 
 
var distributedSystem = new function(){ 
 
 	var _this = this;
	//uuid
	
	
	
	var uuid = function() {
		var s4 = function() {
			return Math.floor((1 + Math.random()) * 0x10000)
								 .toString(16)
								 .substring(1);
		};
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
					 s4() + '-' + s4() + s4() + s4();
	};
	
	
	//settings:
	
	this.client_id = uuid();
	this.accepts_jobs = 1;
	this.pause = false;
	this.jobs = {};
	
	
	
	
	this.togglePause = function(){
		this.pause = ( this.pause ) ? false : true;
		
		/*if( this.pause ){
			acquireWorkerChannel.unsubscribe();
		} else {
			acquireWorkerChannel.subscribe();
		}*/
	};
	
	this.isPaused = function(){
		return this.pause;
	};
	
	
	
	this.workers = new function(){
		
		
		this.add = function( worker ){
			this._workers[worker.id] = worker;
		};
		
		this.remove = function( worker ){
			delete this._workers[worker.id];
		};
		
		this.get = function(id){
			return this._workers[id];
		};
		
		this.getAll = function(){
			return this._workers;
		};
		
		/*this.releaseAll = function( jobChannel ){
			for( var id in this._workers ){
				//console.log(id);
				socket.emit('sendToClient',{
					client_id: id,
					sender_id: _this.client_id,
					action: 'release',
					jobChannel: jobChannel,
				});
			}
		};*/
		
		this.removeAll = function(){
			this._workers = {};
		};
		
		//init:
		this.removeAll();
		return this;
	}();
	
	var jobChannels = new function(){
		this.channels = {};
		
		this.add = function( channel ){
			this.channels[channel.room] = channel;
		};
		
		this.remove = function( channel ){
			delete this.channels[channel.room];
		};
		
		this.get = function(room){
			return this.channels[room];
		};
		return this;
	}();
	var channel = function(socket,room){
		this.room = room;
		
		this.hooks = {
			'onMessage':function(data){}
		};
		
		
		this.addHook = function(hook,fnct){
			this.hooks[hook] = fnct;
		};
		
		this.leave = function(){
			socket.emit('unsubscribe', {
				sender_id: _this.client_id,
				room: this.room
			});
			jobChannels.remove(this);
			delete this;
		};
		this.onMessage = function(d){
			this.hooks['onMessage'](d);
		};
		
		this.unsubscribe = function(){
			socket.emit('unsubscribe',{
				room: this.room,
				sender_id: _this.client_id,
			});
		};
		
		this.subscribe = function(){
			socket.emit('subscribe', {
				sender_id: _this.client_id,
				room: this.room
			});
			
			//console.log('send subscribe request for room',this.room);
		}
		
		this.subscribe();
		jobChannels.add(this);
	};
	
	
	
	//socketio client:
	if( typeof io !== 'undefined' ){
		var socket = io('http://yourserver.com:8888/distributedSystem');
		socket.on('connect', function () {
		
			//console.log('connected');
			socket.on('private_message', function (data) {
				//console.log('private message received from...',data);
				
				switch( data.action ){
					case 'joinchannel':
						var incomingChannel = jobChannels.get(data.room);
						incomingChannel.onMessage(data);
					break;
					
					
					case 'bind':
						//logToScreen(_this.accepts_jobs);
						if( this.pause ) {
							
							//console.log('jobs requested, but client is paused!');
							logToScreen('jobs requested, but client is paused!');
							
							socket.emit('acquireWorkers', {
								jobID: data.jobID,
								sender_id: _this.client_id,
								action: "declineJob"
							});
							
						} else if( _this.accepts_jobs > 0 ){
							_this.accepts_jobs--;
							
							socket.emit('acquireWorkers', {
								jobID: data.jobID,
								sender_id: _this.client_id,
								action: "acceptJob"
							});
							
							//logToScreen( JSON.stringify( data ) );
							
							var sharedJobChannel = new channel(socket,data.jobChannel);
							
							_this.jobs[data.jobID] = {
								//jobCount: data.jobCount,
								//finished: 0,
								jobChannel: data.jobChannel,
								job: data.job,
								jobParams: data.jobParams
							};
							_this.jobFunctions[_this.jobs[data.jobID].job].initSlave(_this.shared,data);
							
							//console.log('run job',data.job);
							
							sharedJobChannel.addHook('onMessage', function( data ) {
									
								switch (data.action) {
									case 'shareData':
										
										//what to perform with shared data...
										//console.log('received shared data',data.data);
										
										_this.jobFunctions[_this.jobs[data.jobID].job].sharedData(_this.shared,data.data);
										
									break;
								}
							});
							
							
							
						} else {
							//console.log('jobs requested, but already busy!');
							
							
							_this.jobFunctions[_this.jobs[data.jobID].job].clientBusy(_this.shared);
							
							socket.emit('acquireWorkers', {
								jobID: data.jobID,
								sender_id: _this.client_id,
								action: "declineJob"
							});
							
							//acquireWorkerChannel.unsubscribe();
							
							
						}
					break;
					
				
					case 'release':
						
						//resubscibe back to acquire channel:
						/*if( _this.accepts_jobs === 0 ){
							acquireWorkerChannel.subscribe();
						}*/
						
						_this.accepts_jobs++;
						
						//stop job here
						
						
						//exit shared channel:
						socket.emit("unsubscribe", {
							sender_id: _this.client_id,
							jobID: data.jobID,
							room: _this.jobs[data.jobID].jobChannel
						});
						
						//logToScreen( 'released from job' );
						
					break;
					
					case 'startJob':
						
						//console.log('execute');
						
							
						//console.log(_this.jobs[data.jobID].job);
						//eval( 'job = ' + data.job + ';');
						//http://stackoverflow.com/questions/19357978/indirect-eval-call-in-strict-mode
						//(0, eval)('jobFunction = ' + data.job + ';');
						
						var jobFunction = _this.jobFunctions[_this.jobs[data.jobID].job].start;
						var job = new distributedSystemJob(_this,socket,data);
						
						jobFunction( _this.shared, _this.jobs[data.jobID].jobParams ).then(function( result ){
							//success:
							//console.log('success');
							//logToScreen( 'job execution finished' );
							
							job.endJob( result );
							
							//send result back to job initiator
							/*socket.emit('sendToClient', {
								room: data.jobChannel,
								client_id: data.client_id, //send back to sender...
								action: 'jobEnd',
								result : JSON.stringify( result )
							});
							*/
							
						},function(reject){
							
							//reject
							//console.error('rejected');
						
						},function(result){
							//console.log('notify..function');
							
							//logToScreen( 'pushing calculated data to initiator' );
							
							//notify: send result back to job initiator
							job.sendData( result );
						});
							
						
						
					break;
					
					
					
					/* master */
					
					case 'jobData':
					
						//console.log(data.result);
						
						//retreive common data:
						
						_this.jobFunctions[_this.jobs[data.jobID].job].sharedDataOnMaster(_this.shared,data.result);
						
						//sharedData = { 'test': 'bla' };
						
						//redestribute to shared channel
						socket.emit("sendToRoom", {
							sender_id: _this.client_id,
							jobID: data.jobID,
							room: _this.jobs[data.jobID].jobChannel,
							action: 'shareData',
							data: data.result
						});
						
					
					
					break;
					
					
					case 'jobEnd':
						
						
						_this.jobFunctions[_this.jobs[data.jobID].job].jobPartEnd(_this.shared,data.sender_id);
						_this.jobs[data.jobID].finished++;
						//console.log(data.result);
						
						//all clients finished=> trigger finish callback
						if( _this.jobs[data.jobID].finished === _this.jobs[data.jobID].jobCount ){
							_this.jobFunctions[_this.jobs[data.jobID].job].jobEnd(_this.shared,data);
						}
						//logToScreen( 'worker ' + data.sender_id + ' finished' );
						
					break;
					
					
					case 'confirm_acquire':
						
						_this.workers.add({ id: data.sender_id });
						
						_this.jobFunctions[_this.jobs[data.jobID].job].slaveAcquired(_this.shared,data);
						//logToScreen( 'worker ' + data.sender_id + ' acquired' );
						
						//start job:
						socket.emit('sendToClient',{
							client_id: data.sender_id,
							sender_id: _this.client_id,
							
							jobID: data.jobID,
							action: 'startJob',
							
							/*job_type: 'embedded',
							job: 'permuteExample',
							jobParams: ''*/
						});
						
						
					break;
					
					
					default:
					
					break;
					
				}
			});
			socket.on('message', function (data) {
				//console.log(data);
				//console.log(jobChannels.channels);
				var incomingChannel = jobChannels.get(data.room);
				incomingChannel.onMessage(data);  
			  
			});
			socket.emit('register', {
				sender_id: _this.client_id,
				job_count: _this.accepts_jobs
			});
			
			//create acquireWorker channel
			var acquireWorkerChannel = new channel(socket,'acquireWorkers');
			
		});
	}
	
	
	//jobParams: for each job an element to send eg count = 2: [{data1},{data2}]
	this.startJob = function(count,job,jobParams){
		_this.jobFunctions[job].initMaster(_this.shared);
		
		if( typeof io === 'undefined' ) {
			console.error('distributed system not available');
			_this.jobFunctions[job].unavailable(_this.shared);
			return;
		}
		
		
		var acquireWorkersChannel = jobChannels.get('acquireWorkers');
		var jobID = uuid();
		var jobChannel = new channel(socket,'job_'+jobID);
		this.jobs[jobID] = {
			jobCount: count,
			finished: 0,
			jobChannel: 'job_'+jobID,
			job: job,
			jobParams: jobParams
		};
	
		socket.emit(acquireWorkersChannel.room, {
			action: 'acquire',
			sender_id: _this.client_id,
			jobID: jobID,
			jobChannel: jobChannel.room,
			job: this.jobs[jobID].job,
			jobParams: this.jobs[jobID].jobParams,
			count: count
		});

	};

	var distributedSystemJob = function(distributedSystem,socket,data){
	
		this.distributedSystem = distributedSystem;
		this.socket = socket;
		this.data = data;
	
		this.sendData = function(result){
			
			//console.log('share data with initiator',this.data.sender_id,this.distributedSystem.client_id);
			this.socket.emit('sendToClient', {
				jobID: this.data.jobID,
				sender_id: this.distributedSystem.client_id,
				client_id: this.data.sender_id, //send back to sender...
				action: 'jobData',
				result : result
			});
		};
		
		this.endJob = function(result){
			//console.log('sending final data back to initiator',this.data.sender_id,this.distributedSystem.client_id);
			this.socket.emit('sendToClient', {
				jobID: this.data.jobID,
				sender_id: this.distributedSystem.client_id,
				client_id: this.data.sender_id, //send back to sender...
				action: 'jobEnd',
				result : result
			});
		};
	
	};
	
	this.merge_options = function(obj1,obj2){
		
	    for (var a in obj2) { obj1[a] = obj2[a]; }
	    
	};
	
	this.jobFunctions = {};
	this.shared = {}; //shared object between all functions (always first parameter)
	this.addJob = function(id,fncts){
		_this.jobFunctions[id] = {};
		var defaults ={
			initMaster: function(ds){
			},
			initSlave: function(ds,data){
			},
			unavailable: function(){
			},
			
			start: function(ds,data){
				var deferred = Q.defer();
				
				//to send data to all connected clients:
				//deferred.notify();
				
				deferred.resolve();
				return deferred.promise;
			},
			sharedData: function(ds,data){
			},
			sharedDataOnMaster: function(ds,data){
			},
			jobPartEnd: function(ds){
			},
			jobEnd: function(ds,data){
			},
			slaveAcquired: function(ds,data){
			}
			
			
		};
		//allowed: startFnct,sharedDataFnct,sharedDataOnMaster,jobPartEnd,jobEnd,clientBusy
		this.merge_options(defaults,fncts);
		_this.jobFunctions[id] = defaults;
		/*
		_this.jobFunctions[id].start = startFnct;
		_this.jobFunctions[id].sharedData = sharedDataFnct;
		_this.jobFunctions[id].sharedDataOnMaster = sharedDataOnMaster;
		_this.jobFunctions[id].jobPartEnd = jobPartEnd;
		_this.jobFunctions[id].jobEnd = jobEnd;
		_this.jobFunctions[id].clientBusy = clientBusy;*/
	};
	
	
	

}();





var logToScreen = function(txt){
	document.getElementById('log').innerHTML += '<br/>'+txt;
};

