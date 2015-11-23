/*
	messaging server
*/

var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(8888);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
};

var distributedSystem = io.of('/distributedSystem');


/* core fncts */
var uuid = function() {
	var s4 = function() {
		return Math.floor((1 + Math.random()) * 0x10000)
							 .toString(16)
							 .substring(1);
	};
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
				 s4() + '-' + s4() + s4() + s4();
};

var objectsize = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};



var availableClients = function(){

	//represents queue (ids of elements)
	this.clients = [];
	this.client_id_by_socket_id = {};
	
	//var sender_id = clients_available.getIDBySocketId(socket.id);
	
	//content behind every id:
	this.elements = {};
	
	//add element to queue:
	this.add = function(elem){
		//console.log( 'add', elem.id);
		this.elements[elem.id] = elem;
		this.client_id_by_socket_id[elem.socket_id] = elem.id;
		
		this.clients.push(elem.id);
		this.clients.sort( this.sort );
		
	};
	
	var _this = this;
	
	this.sort = function( aID, bID ){
		if (aID == bID) {
			return 0;
		}
		var a = _this.elements[aID],
			b = _this.elements[bID];
		var capA = a.capacity();
		var capB = b.capacity();
		if (capA > capB) {
			return 1;
		} else if (capA < capB) {
			return -1;
		} else {
			return 0;
		}
	};
	this.resort = function(){
		this.clients.sort(this.sort);
	};
	
	this.clientCount = function(){
		return this.clients.length;
	};
	
	//remove element from queue:
	this.remove = function(elem){
		this.removeById(elem.id);
	};

	this.removeById = function(id){
		
		var index = this.clients.indexOf(id);
		//console.log('remove',id,index);
		this.clients.splice(index, 1);
		
		delete(this.client_id_by_socket_id[this.elements[id].socket_id]);
		delete(this.elements[id]);
	};
	
	
	this.getClients = function(count,exclude){
		var r = [],
			found = 0,
			i = 0,
			client,
			abort = false,
			id,
			last;
		//console.log(this.elements);console.log('---');console.log(this.clients);
		
		//excl,1,2,3
		//0,excl,2,3
		while(!abort && found < count){
			id = this.clients[i];
			if(!id){
				//last element reached:
				if( i === 0 ){
					abort = true;
					continue;
				}
				//restart
				last = id;
				i=0;
				continue;
			} else if( id === exclude ){
				//last element reached:
				
				if( !this.clients[i+1] || this.clients[i+1] === last ){
					if( i === 0 ){
						abort = true;
						continue;
					}
					i = 0;
					last = id;
					continue;
				}
				//skip
				i++;
				continue;
			}
			client = this.elements[ id ];
			if( client.capacity() > 0 ){
				r.push( client );
				client.jobs_assigned++;
				found++;
				i++;
			} else if( i == 0 ){
				abort = true;
			} else {
				last = id;
				i=0;
			}
			
		}
		return r;
	};
	this.get = function( id ){
		return this.elements[id];
	};
	this.getIDBySocketId = function(socket_id){
		return this.client_id_by_socket_id[socket_id];
	};	
};

var acquireWorkerStat = {};


var client = function(socket,data){
	this.id = data.sender_id;
	this.socket = socket;
	this.socket_id = socket.id; //cache!
	this.jobs_available = data.job_count;
	this.jobs_assigned = 0;
	var _this = this;
	this.capacity = function(){
		return _this.jobs_available-_this.jobs_assigned;
	};
};

var clients_available = new availableClients();
var acquireWorkers = {};
var acquireWorkersArray = [];

distributedSystem.on('connection', function (socket) {
	console.log('welcome client');
	
	
	socket.on('disconnect', function(){
		var client_id = clients_available.getIDBySocketId(socket.id);
		clients_available.removeById( client_id );
		console.log('byebye '+client_id);
	});
	
	socket.on("register", function(data) {
		clients_available.add( new client(socket,data) );
		//socket.broadcast.to('acquireWorkers').emit('register', data.sender_id );
	});
	
	//welcome new client and send him his id:
	//socket.to(id).emit('welcome', {'id': id});
	

	socket.on('subscribe', function(data) {
        console.log('joining room', data.room);
        socket.join(data.room);
       	
       	io.of('/distributedSystem').emit('roomCount'+data.room, get_users_by_room('/distributedSystem',data.room).length );
        
        
    });

    socket.on('unsubscribe', function(data) {  
        console.log('leaving room', data.room);
        
        socket.leave(data.room);
        
        io.of('/distributedSystem').emit('roomCount'+data.room, get_users_by_room('/distributedSystem',data.room).length );
    });
    
    
   
    socket.on('getRoomCount',function(data){
    	socket.emit('getRoomCount', get_users_by_room('/distributedSystem',data.room).length );
    });
    
    
    
    socket.on('sendInRoom', function(data) {
        console.log('sending message in room '+data.room);
        socket.to(data.room).emit('message', data);
    });
    
    socket.on('sendToRoom', function(data) {
        console.log('sending message to room '+data.room);
        socket.broadcast.to(data.room).emit('message', data);
    });
    
    socket.on('sendToClient', function(data) {
        console.log('sending message to client',data.client_id);
        
        //increase capacity again of worker
        if( data.action === 'jobEnd' ){
        	clients_available.get(data.sender_id).jobs_assigned--;
        	console.log('decrease jobs assigned of '+data.sender_id +' to '+ clients_available.get(data.sender_id).jobs_assigned );
        	
        	var to = clients_available.get(data.sender_id).socket;
        	to.emit('private_message',{
        		sender_id: data.client_id,
        		client_id: data.sender_id,
        		action: 'release',
        		jobID: data.jobID 
        	});
        	
        }
        //socket.in(data.client_id).emit('private_message', data);
        
        var to = clients_available.get(data.client_id).socket;
        to.emit('private_message',data);
    });
	
	
	
	//clients sends message acquireWorkers to get clients for the job:
	socket.on('acquireWorkers', function(data) {
		
		
		switch (data.action) {
			case 'acquire':
				//todo stop process if master cancels reqest!
				acquireWorkerStat[data.jobID] = {
					job_owner_id: data.sender_id,
					required: data.count,
					jobChannel: data.jobChannel,
					
					jobMapping: {},
					
					//todo:
					rejected: [],
					successful: [],
					waiting: []
				};
			
				var getClients = function(){
				
					var remaining = acquireWorkerStat[data.jobID].required - acquireWorkerStat[data.jobID].successful.length - acquireWorkerStat[data.jobID].waiting.length;
					
					if( remaining > 0 ){
						var clients = clients_available.getClients(remaining,acquireWorkerStat[data.jobID].job_owner_id);
						console.log('try to get '+ acquireWorkerStat[data.jobID].required + ' clients for job '+data.jobID);
						var n=objectsize(acquireWorkerStat[data.jobID].jobMapping);
						for ( var i in clients ){
							
							acquireWorkerStat[data.jobID].waiting.push( clients[i].id );
							console.log('try to bind '+clients[i].id);
							clients[i].socket.emit('private_message',{
								//jobCount: data.count,
								jobID: data.jobID,
								jobChannel: data.jobChannel,
								job: data.job,
								jobParams: data.jobParams[n],
								action: 'bind'
							});
							acquireWorkerStat[data.jobID].jobMapping[clients[i].id] = n;
							if( i == data.count -1 )break;
							i++;
							n++;
						}
						clients_available.resort();
					}
					console.log('remaining',remaining,acquireWorkerStat[data.jobID].required,acquireWorkerStat[data.jobID].successful.length,clients_available.clientCount());
					if( acquireWorkerStat[data.jobID].required > acquireWorkerStat[data.jobID].successful.length ){
						setTimeout(function(){
							getClients();
						}, 500);
					}
				};
				getClients();
			break;
			
			//todo:
			case 'declineJob':
				var index = acquireWorkerStat[data.jobID].waiting.indexOf( data.sender_id );
				if( index !== -1 ){
					acquireWorkerStat[data.jobID].waiting.splice(index,1);
				} else {
					console.log('error removing from waiting'+data.sender_id);
				}
				console.log('rejected by'+data.sender_id);
				acquireWorkerStat[data.jobID].rejected.push( data.sender_id );
			break;
			
			
			case 'acceptJob':
				var index = acquireWorkerStat[data.jobID].waiting.indexOf( data.sender_id );
				if( index !== -1 ){
					acquireWorkerStat[data.jobID].waiting.splice(index,1);
				} else {
					console.log('error removing from waiting'+data.sender_id);
				}
				acquireWorkerStat[data.jobID].successful.push( data.sender_id );
				
				console.log('ownerid:'+acquireWorkerStat[data.jobID].job_owner_id);
				var to = clients_available.get(acquireWorkerStat[data.jobID].job_owner_id).socket;
				to.emit('private_message',{
					jobID: data.jobID,
					//jobChannel: acquireWorkerStat[data.jobID].jobChannel,
					action: 'confirm_acquire',
					sender_id: data.sender_id
				});
				
			break;
		}
		
		
	    
	});
	
});


function queueAcquireWorker(sender_id){
	acquireWorkersArray.push(sender_id);
};

function get_users_by_room(nsp, room) {
  var users = []
  for (var id in io.of(nsp).adapter.rooms[room]) {
    users.push(io.of(nsp).adapter.nsp.connected[id]);
  };
  return users;
};
	



/* manual: */

/*
https://github.com/Automattic/socket.io/wiki/How-do-I-send-a-response-to-all-clients-except-sender%3F


// send to current request socket client
socket.emit('message', "this is a test");

// sending to all clients, include sender
io.sockets.emit('message', "this is a test");

// sending to all clients except sender
socket.broadcast.emit('message', "this is a test");

// sending to all clients in 'game' room(channel) except sender
socket.broadcast.to('game').emit('message', 'nice game');

// sending to all clients in 'game' room(channel), include sender
io.sockets.in('game').emit('message', 'cool game');

// sending to individual socketid
io.to(socketid).emit('message', 'for your eyes only');

// send to all clients within the current namespace
socket.nsp.emit('message', 'for everyone in the namespace');

// send to all clients within the current namespace within a room
socket.nsp.in('game').emit('message', 'to all my people in the game in this namespace');

*/