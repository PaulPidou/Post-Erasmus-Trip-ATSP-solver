Array.prototype.rotate = function(n) {
  this.unshift.apply( this, this.splice(n, this.length));
  return this;
}

ATSP = function() {
    this.currentOrder;
    this.nextOrder = [];
    this.distances;
    this.shortestDistance = 0;
}

ATSP.prototype.loadCities = function(cities) {
    var length = cities.length;
    this.currentOrder = [];
    
    this.distances = new Array(length);
    for (var i = 0; i < length; i++) {
        this.distances[i] = new Array(length);
        for (var j = 0; j < length; j++)
            this.distances[i][j] = cities[i][j][2];
        this.currentOrder.push(i);
    }
}

ATSP.prototype.getTotalDistance = function(order) {
    var distance = 0
    for (var i = 0; i < order.length - 1; i++)
        distance += this.distances[order[i]][order[i + 1]];
    distance += this.distances[order[order.length - 1]][order[0]];
    return distance;
}

ATSP.prototype.getNextArrangement = function(order) {
    var newOrder = [];
    
    for(var i = 0; i < order.length; i++)
        newOrder.push(order[i]);
    
    var firstRandomCityIndex = Math.floor((Math.random() * newOrder.length-1) + 1);
    var secondRandomCityIndex = Math.floor((Math.random() * newOrder.length-1) + 1);
    
    var tmp = newOrder[firstRandomCityIndex];
    newOrder[firstRandomCityIndex] = newOrder[secondRandomCityIndex];
    newOrder[secondRandomCityIndex] = tmp;
    
    return newOrder;
}

ATSP.prototype.anneal = function(cities, start_id) {
    var iteration = -1;
    
    var temperature = 10000.0;
    var deltaDistance = 0.0;
    var coolingRate = 0.9999;
    var absoluteTemperature = 0.0001;
    
    var n = -1;

    this.loadCities(cities);
    
    var distance = this.getTotalDistance(this.currentOrder);
    
    while (temperature > absoluteTemperature) {
        this.nextOrder = this.getNextArrangement(this.currentOrder);
        
        deltaDistance = this.getTotalDistance(this.nextOrder) - distance;
        
        if ((deltaDistance < 0) || (distance > 0 && Math.exp(-deltaDistance / temperature) > Math.random())) {
            for (var i = 0; i < this.nextOrder.length; i++)
                this.currentOrder[i] = this.nextOrder[i];
            distance = deltaDistance + distance;
        }
        temperature *= coolingRate;
        iteration++;
    }
    this.shortestDistance = this.getTotalDistance(this.currentOrder);
    for(var j = 0; j < this.currentOrder.length - 1; j++) {
        if (cities[this.currentOrder[j]][this.currentOrder[j + 1]][0] == start_id) {
            n = j;
            break;
        }
    }
    if (n == -1) { n = this.currentOrder.length - 1; }
    this.currentOrder.rotate(n);
}