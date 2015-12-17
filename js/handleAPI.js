API_handler = function() {
    this.data;
    this.indexes = {
        cheapest: [],
        fatest: [],
        shortest: []
    };
}

Array.prototype.indexOfName = function(name) {
    for (var i = 0; i < this.length; i++)
        if (this[i].name === name)
            return i;
    return -1;
}

API_handler.prototype.orderByFatest = function(routes) {
  var routesSorted = routes.slice();
  routesSorted.sort(function(a, b) {
    if (a.duration > b.duration)
      return 1;
    if (a.duration < b.duration)
      return -1;
    return 0;
  });
  return routesSorted;
}

API_handler.prototype.orderByShortest = function(routes) {
  var routesSorted = routes.slice();
  routesSorted.sort(function(a, b) {
    if (a.distance > b.distance)
      return 1;
    if (a.distance < b.distance)
      return -1;
    return 0;
  });
  return routesSorted;
}

API_handler.prototype.orderByCheapest = function(routes) {
  var routesSorted = routes.slice();
  routesSorted.sort(function(a, b) {
    if (a.indicativePrice.price > b.indicativePrice.price)
      return 1;
    if (a.indicativePrice.price < b.indicativePrice.price)
      return -1;
    return 0;
  });
  return routesSorted;
}

API_handler.prototype.getMatrix = function(orderMode) {
  var routesPicked;
  var value;
  var matrix = [];
  for (var i = 0; i < this.data.length; i++) {
    var elem = [], index = [];
    for (var j = 0; j < this.data[i].length; j++) {
        if (orderMode == "fatest") {
          routesPicked = this.orderByFatest(this.data[i][j][2].routes);
          value = routesPicked[0].duration;
        } else if (orderMode == "shortest") {
          routesPicked = this.orderByShortest(this.data[i][j][2].routes);
          value = routesPicked[0].distance;
        } else if (orderMode == "cheapest") {
          routesPicked = this.orderByCheapest(this.data[i][j][2].routes);
          value = routesPicked[0].indicativePrice.price;
        } else {return null;}
        index.push([this.data[i][j][0], this.data[i][j][1], i, j, this.data[i][j][2].routes.indexOfName(routesPicked[0].name)]);
        if (i == j) {
            elem.push([this.data[i][j][0], this.data[i][j][0], 0]);
        }
        elem.push([this.data[i][j][0], this.data[i][j][1], value]);
    }
    if (i == this.data.length - 1) {
        elem.push([this.data[i][0][0], this.data[i][0][0], 0]);
    }
    matrix.push(elem);
    this.indexes[orderMode].push(index);
  }
  return matrix;
}

API_handler.prototype.addDummyNode = function(matrix, start, end) {
    var length = matrix.length;
    var elem = [];
    for (var i = 0; i < length; i++) { 
        if (matrix[i][0][0] == start) {
            matrix[i].push([matrix[i][0][0], "#", 0]);
            elem.push(["#", matrix[i][0][0], 0]);
        } else if (matrix[i][0][0] == end) {
            for (var j = 0; j < length; j++) {if(i != j) matrix[i][j][2] = Infinity;}
            matrix[i].push([matrix[i][0][0], "#", 0]);
            elem.push(["#", matrix[i][0][0], 0]);
        } else {
            matrix[i].push([matrix[i][0][0], "#", Infinity]);
            elem.push(["#", matrix[i][0][0], Infinity]);
        }
    }
    elem.push(["#", "#", 0]);
    matrix.push(elem);
    return matrix;
}

API_handler.prototype.fixOrder = function(locations, data) {
  var orderedData = [];
  var loc_from, loc_to;
  
  for(var i = 0; i < locations.length; i++) {
    var one_city = [];
    loc_from = locations[i][0] + '_' + locations[i][1] + '_' + locations[i][2];
    for(var j = 0; j < locations.length; j++) {
      if (i != j) {
        loc_to = locations[j][0] + '_' + locations[j][1] + '_' + locations[j][2];
        var elem = [];
        elem.push(loc_from);
        elem.push(loc_to);
        one_city.push(elem);
      }
    }
    orderedData.push(one_city);
  }
  
  for(var i = 0; i < orderedData.length; i++) {
    for(var j = 0; j < orderedData[i].length; j++) {
      for(var k = 0; k < data.length; k++) {
        for(var l = 0; l < data[k].length; l++) {
          if (orderedData[i][j][0] == data[k][l][0] && orderedData[i][j][1] == data[k][l][1]) {
            orderedData[i][j].push(data[k][l][2]);
          }
        }
      }
    }
  }
  return orderedData;
}

API_handler.prototype.handle = function(locations, callback) {
  var data = [];
  var link, oId, dId;
  var nb_data = 0;
  for(var i = 0; i < locations.length; i++) {
    (function(i) {
      var elem = [];
    for(var j = 0; j < locations.length; j++) {
      (function(j) {
        if (i != j) {
          link = "http://free.rome2rio.com/api/1.2/json/Search?key=[API-KEY]&oName=" + locations[i][0] + "&oPos=" + locations[i][1] + "," + locations[i][2] + "&oKind=city&dName=" + locations[j][0] + "&dPos=" + locations[j][1] + "," + locations[j][2] + "&dKind=city&currencyCode=EUR";
          oId = locations[i][0] + '_' +  locations[i][1] + '_' + locations[i][2];
          dId = locations[j][0] + '_' +  locations[j][1] + '_' + locations[j][2];
          (function(oId, dId) {
              $.when($.getJSON(link)).then(function(data) {
                  elem.push([oId, dId, data]);
                  nb_data++;
              });
          })(oId, dId);
        }
     })(j);
    }
    data.push(elem);
    })(i);
  }
  
  var self = this;
  var getData = setInterval (function(){
    if (nb_data == (locations.length * (locations.length - 1))) {
        clearInterval(getData);
        self.data = self.fixOrder(locations, data);
        callback();
    }
  }, 5);
}