'use strict';

var ports = [];

self.addEventListener('connect', function(eventC){
	console.log('Start of test...');
    var port = eventC.ports[0];
    ports.push(port);

    port.postMessage(self.test);
    return;    
        
    var i = 0;
    
    function timedCount() {
    	i = i + 1;
    	port.postMessage(i);
    	setTimeout(timedCount,500);
    }
    //postMessage(JSON.stringify(self));
    timedCount();    
}, false );


