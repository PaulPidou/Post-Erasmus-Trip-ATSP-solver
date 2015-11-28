API_handler = function() {
    this.data;
    //this.resultPaths = [];
}

API_handler.prototype.orderByFatest = function(routes) {
  var routesSorted = routes;
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
  var routesSorted = routes;
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
  var routesSorted = routes;
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
    var elem = [];
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
        if (i == j) {
            elem.push([this.data[i][j][0], this.data[i][j][0], 0]);
        }
        elem.push([this.data[i][j][0], this.data[i][j][1], value]);
    }
    if (i == this.data.length - 1) {
        elem.push([this.data[i][0][0], this.data[i][0][0], 0]);
    }
    matrix.push(elem);
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
            matrix[i].push([matrix[i][0][0], "#", 0]);
            elem.push(["#", matrix[i][0][0], 0]);
        } else {
            matrix[i].push([matrix[i][0][0], "#", Infinity]);
            elem.push(["#", matrix[i][0][0], Infinity]);
        }
    }
    elem.push(["#", "#", 0]);
    matrix.push(elem);
}

API_handler.prototype.handle = function(locations) {
  dataGot = [];
  var link, oId, dId;
  var nb_data = 0;
  for(var i = 0; i < locations.length; i++) {
    (function(i) {
      var elem = [];
    for(var j = 0; j < locations.length; j++) {
      (function(j) {
        if (i != j) {
          link = "http://free.rome2rio.com/api/1.2/json/Search?key=XRpzZBCX&oName=" + locations[i][0] + "&oPos=" + locations[i][1] + "," + locations[i][2] + "&oKind=city&dName=" + locations[j][0] + "&dPos=" + locations[j][1] + "," + locations[j][2] + "&dKind=city&currencyCode=EUR";
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
    dataGot.push(elem);
    })(i);
  }
  
  var getData = setInterval (function(){
    if (nb_data == (locations.length * (locations.length - 1))) {
        clearInterval(getData);
        this.data = dataGot.slice();
    }
  }, 100);
}