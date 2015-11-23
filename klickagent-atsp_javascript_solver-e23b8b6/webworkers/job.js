var i = 0;

//attention: firefox cannot overwrite console.log!
console.log = function(){ 
	postMessage({cmd: 'console.log', content: Array.prototype.slice.call(arguments)}); 
};

console.log('init worker');

function timedCount() {
	i = i + 1;
	postMessage({content:i});
	console.log('worker in progress');
	setTimeout("timedCount()",500);
}
//console.error(self.location);
//console.error(self);
//postMessage(JSON.stringify(self));
timedCount();
