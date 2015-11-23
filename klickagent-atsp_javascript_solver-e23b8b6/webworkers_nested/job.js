if(typeof(Worker) !== "undefined") {
		if(typeof(w) == "undefined") {
				w = new Worker("job_nested.js");
		}
		w.onmessage = function(event) {
				postMessage(event.data);
		};
} else {
		postMessage("Sorry! Nested Web Workers no supported.");
}