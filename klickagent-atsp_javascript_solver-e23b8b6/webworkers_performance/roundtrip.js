self.onmessage = function(e) {
  var res = eval(e.data.cmd)(e.data.args);
  postMessage(res);
};
function run(){
	var i = 0;
	setInterval(function() {
   		i++;
    	postMessage(i); // sent data to main app
	}, 500);
};
var permArr = [], usedChars = [];
var len;
function permute(input,r) {
	if( typeof r === 'undefined' ){
		len = input.length;
		var i, ch;
	}
    
    for (i = 0; i < input.length; i++) {
        ch = input.splice(i, 1)[0];
        len--;
        usedChars.push(ch);
        if (input.length == 0) {
            permArr.push(usedChars.slice());
        }
        permute(input,true);
        input.splice(i, 0, ch);
        len++;
        usedChars.pop();
    }
    return permArr;
};

function permuteExample(){
	var arr = [];
	for(var i = 0 ; i < 6 ; i++ ){
		arr.push(i); //[i,i+1]
	};
	var permutations = permute(arr);
	return permutations;
	
}; 


function confirm(){
	postMessage('confirm');
}