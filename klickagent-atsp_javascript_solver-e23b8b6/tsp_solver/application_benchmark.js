"use strict";

/* * global start time (ms) */
var start = null;

/** The Application Benchmark Module module:Benchmark.
 * @module Benchmark
 */

var data = {};

var parse_input_to_config = function(){

	//reset:
	data.testConfigs = [];

	var count_of_waypoints = document.getElementById('test_for_waypoints').value.split(',');
	var repeat = parseInt(document.getElementById('test_count').value);
	var test_types = getSelectValues(document.getElementById('test_types'));
	var thread_counts = document.getElementById('threadCount').value.split(',');
	
	
	var k,j,i,c,t,test_type,thread_count,obj,distanceTable;
	
	//generate waypoints and distance matrices:
	for( i in count_of_waypoints ){
		
		c = parseInt(count_of_waypoints[i]);
		distanceTable = generateRandomWaypoints(c);

		for( t in  test_types ){

			test_type = test_types[t];
			
			if( test_type === 'bnb_webworker' || test_type === 'bnb_server_multithread' ){
				for( k in thread_counts ){
					thread_count = parseInt( thread_counts[k] );
					
					//if( typeof data.stats[c+','+thread_count+','+test_type] === 'undefined' ) data.stats[c+','+thread_count+','+test_type] = [];
				
					
					for( j = 0; j < repeat ; j++ ){
						obj = {
							waypoints: c,
							mode: test_type,
							threadCount: thread_count,
							repetition: j,
							executionTime: Infinity,
							distanceTable: distanceTable
						};
						
						//data.stats[c+','+thread_count+','+test_type].push(obj);
						data.testConfigs.push(obj);
					}
				}
			} else {
				//if( typeof data.stats[c+','+test_type] === 'undefined' ) data.stats[c+','+test_type] = [];
				
				for( j = 0; j < repeat ; j++ ){
					var obj = {
						waypoints: c,
						mode: test_type,
						repetition: j,
						threadCount: 1,
						executionTime: Infinity,
						distanceTable: distanceTable
					};
					//data.stats[c+','+test_type].push(obj);
					data.testConfigs.push(obj);
				}
			}
		}
	}
	
	document.getElementById('testconfig').value = JSON.stringify( data );

};

window.onload = function(){
	parse_input_to_config();
};

var run_tests = function(){
	
	document.getElementById('run').disabled = true;
	
	data = JSON.parse( document.getElementById('testconfig').value );
	data.stats = {};
		
		
	//init stats:
	for(var i in data.testConfigs ){
		
		if( data.testConfigs[i].mode === 'bnb_webworker' || data.testConfigs[i].mode === 'bnb_server_multithread' ){
			var key = data.testConfigs[i].waypoints+','+data.testConfigs[i].threadCount+','+data.testConfigs[i].mode;
			
		} else {
			var key = data.testConfigs[i].waypoints+','+data.testConfigs[i].mode;
		}
		if( typeof data.stats[key] === 'undefined' ) data.stats[key] = [];
		data.stats[key].push(data.testConfigs[i]);
	}	
	
	//generate result table:
	
	var table = document.getElementById('tests');
	var j;
	for( var i in data.testConfigs ){
		j = parseInt(i)+1;
		// Create an empty <tr> element and add it to the 1st position of the table:
		var row = table.insertRow(j);
		
		// Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
		var cell1 = row.insertCell(0);
		var cell2 = row.insertCell(1);
		var cell3 = row.insertCell(2);
		var cell4 = row.insertCell(3);
		var cell5 = row.insertCell(4);
		var cell6 = row.insertCell(5);
		var cell7 = row.insertCell(6);
		
		// Add some text to the new cells:
		cell1.innerHTML = i;
		cell2.innerHTML = JSON.stringify(data.testConfigs[i].distanceTable.length);
		cell3.innerHTML = data.testConfigs[i].mode;
		cell4.innerHTML = data.testConfigs[i].threadCount;
		cell5.innerHTML = '';
		cell6.innerHTML = '';
		cell7.innerHTML = '';
		
	}
	
	
	
	runInvariant(0);
	document.getElementById('stats').innerHTML = '';
};

var finishTests = function(){
	
	document.getElementById('log').innerHTML = 'finished all Tests';
	document.getElementById('run').disabled = false;
	
	var txt = '';
	txt += '<h3>Statistics of the Tests</h3><table><tr><th>type</th><th>time</th></tr>';
	
	for( var i in data.stats ){
		
		var tot = data.stats[i].length;
		var sum = 0;
		for ( var j in data.stats[i] ){
			sum+=data.stats[i][j].executionTime;
		}
		txt += '<tr><td>'+ i + ' </td><td> ' + (sum/tot) + '</td></tr>';
	}
	
	
	document.getElementById('stats').innerHTML = txt;
	
	
};


function getSelectValues(select) {
	var result = [];
	var options = select && select.options;
	var opt;
	
	for (var i=0, iLen=options.length; i<iLen; i++) {
	opt = options[i];
	
	if (opt.selected) {
	  result.push(opt.value || opt.text);
	}
	}
	return result;
}


var postMessage = function(d){

	var testNr = d.params;
	
	
	if( !d.type ) d.type = 'status';
	if( d.type === 'result' ) {
		var end = new Date().getTime();
		var time = end - start;
		//console.log('Execution time: ' + time);
		//document.getElementById('log').innerHTML = JSON.stringify( d.bestTour ) + ' ' + d.bestTourWeight + ' Execution time: ' + time;
	
		//write results to table:
		var row = document.getElementById('tests').rows[testNr+1];
		row.cells[4].innerHTML = time;
		row.cells[5].innerHTML = d.bestTourWeight;
		row.cells[6].innerHTML = JSON.stringify( d.bestTour );
	
		//console.log('#### RESULT: ####');
	
		//console.log(d.cities);
		//console.log(d.bestTour,d.bestTourWeight);
	
		//console.log('#### end RESULT ####');
		
		data.testConfigs[testNr].executionTime = time;
		
		if( testNr+1 < data.testConfigs.length ){
			window.setTimeout(function(){
				runInvariant(testNr+1);
			},1);
		} else {
			finishTests();
		}
	}
};

/**
 * run invariant
 *
 * @param  mode 1=client, 1.1=client webworker, 2=server, 3=client distributed, 4=server distributed, 5=client/server distributed
 * @return void, renders map
 */
 
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


var generateRandomWaypoints = function(c,testnr){
	if( c ){
		c = parseInt(c);
		var distanceTable = [];
		var waypoints = [];
		
		/* 
		generate realistic demo records: 
		abs( d(x,y)-d(y,x) ) <= 5
		*/
		for( var i = 0; i < c ; i++ ){
			waypoints.push({'x': 0, 'y': 0});
			distanceTable[i] = [];
			for( var j = 0; j <= i ; j++ ){
				if( i === j ){
					distanceTable[i][j] = Infinity;
				} else /*if( typeof distanceTable[j][i] !== 'undefined' )*/{
					distanceTable[i][j] = getRandomInt(1,100);
					var plusMinus = getRandomInt(0,1);
					var diff = getRandomInt(0,5);
					diff = ( plusMinus === 0 ) ? -1 * diff : diff;
					if( typeof distanceTable[j] === 'undefined' ) distanceTable[j] = [];
					distanceTable[j][i] = distanceTable[i][j]+diff;
				} /*else {
					distanceTable[i][j] = getRandomInt(1,100);
				}*/
			}
		
		}
	}

	return distanceTable;
};




var runInvariant = function(testNr){
	document.getElementById('log').innerHTML = testNr + ' out of ' + data.testConfigs.length + ' Tests';

	var algoMode = data.testConfigs[testNr].mode,
		threadCount = data.testConfigs[testNr].threadCount,
		dt = data.testConfigs[testNr].distanceTable;
	
	//worker.postMessage({cmd: 'startBruteForce', data: {cities: waypoints, distanceTable: distanceTable } } );
	//console.log('STARTED');
	
	var a = algoMode.split('_');
	var algo = a.splice(0, 1)[0];
	var mode = a.join('_');
	//console.error(algo,mode);
	//stop time:
	start = new Date().getTime();
	
	if( algoMode === 'bnb_singlethread' ){
	
		var worker = new Worker("TSP_Solver.js");
		/* event listener for messaging with main thread: */
		worker.onmessage = function(d){
			d.data.params = testNr;
			postMessage(d.data);
		};
		worker.postMessage({ cmd: 'tsp', waypoints: {}, distanceTable: dt , algo: algo, mode: mode, modeThreadC: 0} );
	
	} else {
	
	
		if(threadCount){
			if( threadCount > (dt.length-1) ){
				threadCount = (dt.length-1);
				console.error( 'thread count adjusted to',threadCount);
			}
		}
		
		
		if( algoMode === 'bnb_server' || algoMode === 'bnb_server_multithread' ){
			//ajax request to server:
			$.ajax({
				dataType: "jsonp",
				type: "post",
			  	url: "http://yourserver.com:8001",
			  	data: { cmd: 'tsp', waypoints: JSON.stringify({}), distanceTable: JSON.stringify(dt) , algo: algo, mode: mode, modeThreadC: threadCount}
			}).done(function(d) {
				d.params = testNr;
			  	postMessage(d);
			});
		} else {
			solve_tsp_helper_function(window,{},dt,algo,mode,threadCount,testNr);
		}
	}
		
};