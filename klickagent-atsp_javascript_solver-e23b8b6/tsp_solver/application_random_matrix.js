/** The generator for random waypoints module:randomWaypoints.
 * @module RandomWaypoints
 */

self.onmessage = function(e) {
  var res = eval(e.data.cmd)(e.data.args);
  postMessage(res);
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var generateRandomWaypoints = function(c){
	var c = parseInt(c);
	var distanceTable = [];
	
	/* 
	generate realistic demo records: 
	abs( d(x,y)-d(y,x) ) <= 5
	*/
	for( var i = 0; i < c ; i++ ){
		distanceTable[i] = [];
		for( var j = 0; j <= i ; j++ ){
			if( i === j ){
				distanceTable[i][j] = Infinity;
			} else /*if( typeof distanceTable[j][i] !== 'undefined' )*/{
				distanceTable[i][j] = getRandomInt(100000,200000);
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
	
	return distanceTable;
};