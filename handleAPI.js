var resultPaths = [];

function orderByFatest(routes) {
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

function orderByShortest(routes) {
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

function orderByCheapest(routes) {
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

function getMatrix(dataGot, orderMode) {
  var routesPicked;
  var value;
  var matrix = [];
  for (var i = 0; i < dataGot.length; i++) {
    var elemn = [];
    for (var j = 0; j < dataGot.length; j++) {
      if (i != j ) {
        if (oderMode == "fatest") {
          routesPicked = orderByFatest(dataGot[i][2].routes);
          value = routesPicked[0].duration;
        } else if (orderMode == "shortest") {
          routesPicked = orderByShortest(dataGot[i][2].routes);
          value = routesPicked[0].distance;
        } else if (orderMode == "cheapest") {
          routesPicked = orderByCheapest(dataGot[i][2].routes);
          value = routesPicked[0].indicativePrice.price;
        } else {return null;}
        elem.push([dataGot[i][j][0], dataGot[i][j][1], value]);
      } else {
        elem.push([dataGot[i][j][0], dataGot[i][j][1], 0]);
      }
    }
    matrix.push(elem);
  }
  return matrix;
}

function addDummyNode(matrix, start, end) {
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

function handleTSP(locations) {
  var dataGot = [];
  var link, oId, dId;
  console.log(locations);
  for(var i = 0; i < locations.length; i++) {
    var elem = [];
    for(var j = 0; j < locations.length; j++) {
        if (i != j) {
          link = "http://free.rome2rio.com/api/1.2/json/Search?key=XRpzZBCX&oName=" + locations[i][0] + "&oPos=" + locations[i][1] + "," + locations[i][2] + "&oKind=city&dName=" + locations[j][0] + "&dPos=" + locations[j][1] + "," + locations[j][2] + "&dKind=city&currencyCode=EUR";
          console.log(link);
          oId = locations[i][0] + '_' +  locations[i][1] + '_' + locations[i][2];
          dId = locations[j][0] + '_' +  locations[j][1] + '_' + locations[j][2];
          $.ajax({
            url:link, 
            dataType:'json',
            async:false,
            success:function(data) {
                elem.push([oId, dId, data]);
            }
          });
        }
    }
    dataGot.push(elem);
  }
  
  console.log(dataGot);
  console.log(JSON.stringify(dataGot));
}