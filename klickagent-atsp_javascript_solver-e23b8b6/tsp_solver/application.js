"use strict";
var start = null;

/** The Application with the tsp solver implementation module:Application.
 * @module Application
 */


var distanceTable = [
	[0,14,4,10,20,4,10,33,2,10],
	[14,0,7,8,7,3,2,99,2,32],
	[4,5,0,7,16,12,3,1,6,9],
	[11,7,9,0,2,2,3,2,2,2],
	[18,7,17,4,0,12,3,4,5,7],
	[1,1,7,2,2,0,88,2,3,6],
	[118,7,17,4,100,2,0,5,6,22],
	[182,7,17,4,33,44,3,0,44,9],
	[1,7,17,4,2,3,33,2,0,10],
	[8,7,17,4,33,1,2,5,6,0]
];

 


var generateRandomWaypoints = function(element, callback){
	var c = document.getElementById('test_waypoints_count').value;
	if( c ){
		var worker = new Worker('application_random_matrix.js');
		worker.postMessage({ 'cmd': 'generateRandomWaypoints', 'args': c });
		worker.onmessage = function (e) {
			distanceTable = e.data;
			callback(element,c,distanceTable);
			worker.terminate();
		};
	}
};

var tsp_instance;
window.onload= function(){

	var run = function(){
		tsp_instance = new TSP();
			
		$('#inputDistanceMatrix').val(JSON.stringify(distanceTable));
		$('#distanceMatrix_c').html(jsonFormat(JSON.stringify(distanceTable)));
		
		var execution_type_input = document.getElementById('execution_type');
		var algorithm_type_input = document.getElementById('algorithm_type');
		
		var disableOptions = function( type , e){
			var obj = e.srcElement;
			var disable = function(sel,enable){
				var ops = sel.options;
				for (var i = 0; i < ops.length; i++) {
					// lowercase comparison for case-insensitivity
					var value = ops[i].value;
					if( enable !== true && value !== '' && enable.indexOf(value.toLowerCase()) === -1 ) 
						ops[i].disabled = true;
					else 
						ops[i].disabled = false;
				}
			};
			
			var enable = eval(e.target.options[e.target.selectedIndex].dataset.allowed);
			if( type === 'algo' ){
				var showThreads = ( execution_type_input.options[execution_type_input.selectedIndex].dataset.threads );
				disable(execution_type_input,enable);
			} else if( type === 'type' ){
				var showThreads = ( e.target.options[e.target.selectedIndex].dataset.threads );
			
				disable(algorithm_type_input,enable);
			}
			if( showThreads ){
				$('#threadCount').show();
			} else {
				$('#threadCount').hide();
			}
			
		};
		
		if( algorithm_type_input )
		algorithm_type_input.addEventListener('change', function(e){ disableOptions('algo',e) } , false);	
		if(execution_type_input)
			execution_type_input.addEventListener('change', function(e){ disableOptions('type',e) }, false);
	};


	//check if server is available:
	$.ajax({
		dataType: "jsonp",
		type: "get",
	  	url: "http://yourserver.com:8888/socket.io/socket.io.js",
	  	complete: function(x,t){
	  		//parsererror is correct, because .js is not valid json...but information is sufficient to detect if file is loaded
	  		if( t !== 'parsererror' ){
	  			//alert('connection to server failed, not all function work properly.');
  				$('[data-server="true"]').each(function(){
  					$(this).html($(this).html()+' (Server inaktiv)');
  					$(this).data('server_down','true');
  					$(this).attr('disabled','disabled');
  				});
  				$('.connecting').html('connection to server failed. therefore not all calculation types work at the moment');
	  		} else {
	  			$('.connecting').remove();
	  		}
	  		run();
	  	}
	});



		
};


/**
 * run invariant
 *
 * @param {mixed} algo - true (boolean) to autodetect best fitting algorithm for the tsp.
 * BruteForce / BnB / Dynamic / Antcolonyk2_k3 / Nearestneighbour to solve with a specific algorithm.
 * @param {mixed} mode - true (boolean) to autodetect best fitting execution mode.
 * normal / singlethread / webworker / server / server_multithread / client_distributed
 * @param {boolean} showAlgo - true, to show selected algorithm in log div
 */
var runInvariant = function(algo,mode,showAlgo){
	
	var threadCount = (mode === 'webworker' || mode === 'server_multithread') ? parseInt(document.getElementById('threadCount').value) : false;
	if( isNaN(threadCount) ) threadCount = false;
	//stop time:
	start = new Date().getTime();
	
	
	tsp_instance.init(distanceTable);
	document.getElementById('stopButton').disabled=false;
	
	tsp_instance.solve(algo,mode,threadCount,function (d) {
	    // Success
	    var end = new Date().getTime();
	    var time = end - start;
	    //console.log('Execution time: ' + time);
	    document.getElementById('log').innerHTML = 
	    	'Best Tour:' + JSON.stringify( d.bestTour ) + '<br/>' + 
	    	'Weight:' + d.bestTourWeight + '<br/>'+
	    	'reduced by ' + d.optimization + '% (start weight:' + d.startTourWeight +')<br/>'+
	    	'Execution time [ms]: ' + time;
	    
	    if( showAlgo ){
	    	document.getElementById('log').innerHTML += '<br/>Algorithm: ' + d.algoname+ '<br/>Mode: ' + d.mode+ '<br/>Threads: ' + d.threads;
	    }
	    
	    	
	    document.getElementById('performButton').disabled=false;
	    document.getElementById('stopButton').disabled=true;
	    
	}, function (err) {
	    // Error
	}, function (progress) {
	    // Progress
	}, function(){
	
	});
	
		
};


var is_array = function(someVar){
	return (Object.prototype.toString.call( someVar ) === '[object Array]');
};

window.jsonFormat = function(json,debug){
	try{
		var json = JSON.parse( json.replace(/ /g,'').replace(/\t/g,'') );
	} catch (error) {
		alert('data could not be parsed');
	}
	if( !is_array(json) ) {
		alert('enter a valid array to proceed');
		return false;
	}
	
	var text = JSON.stringify(json);
	text =  jsonColorize(text).replace(/\],\[/g,'],\n[');
	return text;
};
var jsonColorize = function(json){
 		json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
 		    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
 		        var cls = 'number';
 		        if (/^"/.test(match)) {
 		            if (/:$/.test(match)) {
 		                cls = 'key';
 		            } else {
 		                cls = 'string';
 		            }
 		        } else if (/true|false/.test(match)) {
 		            cls = 'boolean';
 		        } else if (/null/.test(match)) {
 		            cls = 'null';
 		        }
 		        return '<span class="' + cls + '">' + match + '</span>';
 		 });
 };
