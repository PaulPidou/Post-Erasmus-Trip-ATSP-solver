var locations = [];

function initMap() {
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;
  
  var toll = false, highway = false;
  var start_end = ['', ''];
  
  var results;
  var poly = {
    cheapest: undefined,
    fatest: undefined,
    shortest: undefined
  };
  var markers_transit = {
    cheapest: [],
    fatest: [],
    shortest: []
  };
  
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 25, lng: 0},
    zoom: 2
  });
  
  var input = /** @type {!HTMLInputElement} */(
      document.getElementById('pac-input'));

  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  var text;
  var markers = [], bounds;
  
  function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++)
      markers[i].setMap(map);
    markers = [];
  }
  
  function setMarkers(placeGet) {
    var place = placeGet;
    if (place == undefined) {
      // An element has been remove
      cleanMap();
    } else if (!place.geometry) {
      $('#search-warning p').html('<span class="glyphicon glyphicon-exclamation-sign"></span> Please select one place in the list.')
      $('#search-warning').modal();
      return;
    } else {
      input.value = "";
      var element = [place.name, place.geometry.location.lat(), place.geometry.location.lng()];
      for(var i = 0; i < locations.length; i++) {
        if (locations[i][0] == element[0] && locations[i][1] == element[1] && locations[i][2] == element[2]) {
          $('#search-warning p').html('<span class="glyphicon glyphicon-exclamation-sign"></span> This place is already added.')
          $('#search-warning').modal();
          return
        }
      }
      locations.push(element);
    }
    
    bounds = new google.maps.LatLngBounds();
    text = '';

    for (var i = 0; i < locations.length; i++) {  
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(locations[i][1], locations[i][2]),
        map: map
      });
      markers.push(marker);
      bounds.extend(new google.maps.LatLng(locations[i][1], locations[i][2]));
      var id = locations[i][0] + '_' + locations[i][1] + '_' + locations[i][2];
      if (locations.length == 1) {
        start_end = [id, id];
      }
      text += '<a class="list-group-item ';
      if (id == start_end[0]) {
        text += ' start ';
      }
      if (id == start_end[1]) {
        text += ' end ';
      }
        text += '" id="' + id + '"><span class="glyphicon glyphicon-map-marker"></span> ' + locations[i][0] + ' <span class="start-glyph glyphicon glyphicon-home"></span><span class="end-glyph glyphicon glyphicon-flag"></span><span class="glyphicon glyphicon-trash remove pull-right"></span> <span class="glyphicon glyphicon-option-vertical pull-right settings" data-popover="true" data-container="body" data-toggle="popover" data-placement="top" data-html=true data-content="<div class=\'list-group\'><a href=\'#\' class=\'list-group-item start-link\'><span class=\'glyphicon glyphicon-home\'></span> Set as starting point</a><a href=\'#\' class=\'list-group-item end-link\'><span class=\'glyphicon glyphicon-flag\'></span> Set as arriving point</a><div>"></span></a>';
    }
    
    if (locations.length == 1) {
      map.setCenter(markers[0].position);
      map.setZoom(12);
    } else if (locations.length == 0) {
      map.setCenter({lat: 25, lng: 0});
      map.setZoom(2);
      start_end['', ''];
      text = '<p class="text-center">Add some places to visit!</p>';
    } else {
      map.fitBounds(bounds);
    }
    document.getElementById('waypoints').innerHTML = text;
  }

  autocomplete.addListener('place_changed', function() {
    if (locations.length < 8) {
      setMarkers(autocomplete.getPlace())
      enableSubmit(locations);
    } else {
      $('#search-warning p').html('<span class="glyphicon glyphicon-exclamation-sign"></span> You can only select a maximum of eight locations.')
      $('#search-warning').modal();
    }
  });
  directionsDisplay.setMap(map);
  
  document.getElementById('submit').addEventListener('click', function() {
    if ($('#submit').hasClass('disabled')) {
      $('#search-warning p').html('<span class="glyphicon glyphicon-exclamation-sign"></span> You have to add at least three locations.')
      $('#search-warning').modal();
    } else {
      if($('input[name="travel-mode"]:checked').val() == 'car') {
        $("#directions-panel").css('display', 'none');
        $('#gmap_response').css('display', 'block');
        cleanMap();
        calculateAndDisplayRoute(directionsService, directionsDisplay, toll, highway);
        var modals = document.getElementsByClassName('display_route_map');
        //
        var getModals = setInterval (function(){
          if (modals.length == locations.length) {
              clearInterval(getModals);
              for(var i = 0; i < modals.length; i++) {
                var s_e = modals[i].title.split('_'); 
                initMapModal(modals[i].firstChild.lastChild, modals[i].firstChild.firstChild, s_e[0], s_e[1], toll, highway);
              }
          }
        }, 10);
      } else { // transit
        $("#gmap_response").css('display', 'none');
        $("#directions-panel").css('display', 'block');
        $("#directions-panel .heading, #directions-panel .routes").html('');
        results = transitCall(locations, start_end);
        cleanMap();
        var drawing = drawLines(results.cheapest, map);
        poly.cheapest = drawing.poly;
        markers_transit.cheapest = drawing.markers;
      }
    }
  });
  
  $('#mode-selector .dropdown-menu a').click(function() {
    if ($(this).children().hasClass('display')) {
      $(this).children().removeClass('display');
      if ($(this).attr('id') == 'toll') {toll = false;} else {highway = false;}
    } else {
      $(this).children().addClass('display');
      if ($(this).attr('id') == 'toll') {toll = true;} else {highway = true;}
    }
  });
  
  $(document).on('mouseenter', '#waypoints a', function() {$(this).addClass("selected");});
  $(document).on('mouseleave', '#waypoints a', function() {$(this).removeClass("selected");});
  $(document).on('click', '#waypoints a .remove', function() {
    for(var i = 0; i < locations.length; i++) {
      if ($(this).parent().attr('id') == locations[i][0] + '_' + locations[i][1] + '_' + locations[i][2]) {
        locations.splice(i, 1);
        break;
      }
    }
    $("#directions-panel").css('display', 'none');
    $('#gmap_response').css('display', 'none');
    directionsDisplay.setDirections({routes: []});
    if (locations.length > 0) {
      classes = $(this).parent().attr('class').split(" ");
      for (c of classes) {
        if (c == "start") {
          start_end[0] = locations[0][0] + '_' + locations[0][1] + '_' + locations[0][2];
        }
        if (c == "end") {
          start_end[1] = locations[0][0] + '_' + locations[0][1] + '_' + locations[0][2];;
        }
      }
    }
    setMarkers(undefined);
    enableSubmit(locations);
  });
  
  $(document).on('click', '.popover .list-group a', function(ev) {
    var target = $(ev.target);
    element = getElementWithAttribute('aria-describedby', target.closest('.popover').attr('id'));
    if (target.attr('class') == 'list-group-item start-link') {
      start_end[0] = element.closest('a').id;
      $('#waypoints a').removeClass('start');
      document.getElementById(start_end[0]).className += ' start';
    } else if (target.attr('class') == 'list-group-item end-link') {
      start_end[1] = element.closest('a').id;
      $('#waypoints a').removeClass('end');
      document.getElementById(start_end[1]).className += ' end';
    }
  });
  
  $(document).on('click', '#directions-panel .tab-content .routes .list-group-item, #gmap_response .routes .list-group-item', function(ev) {
    var target = $(ev.target);
    if (target[0].nextSibling.className == 'modal fade') {
      target[0].nextSibling.className += ' in';
      target[0].nextSibling.style.display = 'block';
      window.setTimeout(function () {
        google.maps.event.trigger(map, 'resize')
      }, 0);
    }
  });
  
  $(document).on('click', function(ev) {
    var target = $(ev.target);
    if (target[0].className == 'modal fade in') {
      target[0].className = 'modal fade';
      target[0].style.display = 'none';
    } else if (target[0].className == 'close') {
      target[0].parentNode.parentNode.parentNode.parentNode.parentNode.className = 'modal fade';
      target[0].parentNode.parentNode.parentNode.parentNode.parentNode.style.display = 'none';
    }
  });
  
  function cleanMap() {
    ["cheapest", "fatest", "shortest"].forEach(function(value) {
      if (poly[value] != undefined) {
        poly[value].setMap(null);
        poly[value] = undefined;
        for(var i = 0; i < markers_transit[value].length; i++)
          markers_transit[value][i].setMap(null);
        markers_transit[value] = [];
      }
    });
    setMapOnAll(null);
  }
  
  $('#directions-panel .nav a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
    cleanMap();
    var value = $(this).attr('href').substring(1);
    var drawing = drawLines(results[value], map);
    poly[value] = drawing.poly;
    markers_transit[value] = drawing.markers;
  });
}

function drawLines(result, map) {
  var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var labelIndex = 0;
  var location, position;
  var markers = [];
  var start_end = true;
  
  var poly = new google.maps.Polyline({
    strokeColor: '#337ab7',
    strokeOpacity: 0.8,
    strokeWeight: 3
  });
  poly.setMap(map);
  
  var path = poly.getPath();
  
  for(var i = 0; i < result.length; i++) {
    if (result[i][0] != '#') {
      location = result[i][0].split('_');
      position = new google.maps.LatLng(location[1], location[2]);
      path.push(position);
    
      var marker = new google.maps.Marker({
        position: position,
        label: labels[labelIndex++ % labels.length],
        map: map
      });
      markers.push(marker);
    } else {
      start_end = false;
    }
  }
  if (start_end) {
    location = result[0][0].split('_');
    path.push(new google.maps.LatLng(location[1], location[2]));
  }
  
  return {
    poly: poly,
    markers: markers
  };
}

function transitCall(locations, start_end){
  var handler = new API_handler();
  //handler.handle(locations);
  handler.data = data_test;
  var matrices = {
    cheapest: [],
    fatest: [],
    shortest: []
  };
  
  ["cheapest", "fatest", "shortest"].forEach(function(value) {
    if (start_end[0] != start_end[1]) {
      matrices[value] = handler.addDummyNode(handler.getMatrix(value), start_end[0], start_end[1]);
    } else {
      matrices[value] = handler.getMatrix(value);
    }
  });
      
  var solver = new ATSP();
  var results = {
    cheapest: [],
    fatest: [],
    shortest: []
  };
  
  $.each(matrices, function(key, matrix) {
    solver.anneal(matrix, start_end[0]);
    var result = [];
    for (var j = 0; j < solver.currentOrder.length - 1; j++) {
      result.push(matrix[solver.currentOrder[j]][solver.currentOrder[j + 1]]);
    }
    result.push(matrix[solver.currentOrder[solver.currentOrder.length - 1]][solver.currentOrder[0]]);
    results[key] = result;
  });
  displayResults(results, handler);
  return results;
}

function getGlyph(kind) {
  if (kind =='train') {
    return 'fa fa-train';
  } else if (kind == 'bus') {
    return 'fa fa-bus';
  } else if (kind == 'flight') {
    return 'fa fa-plane';
  } else if (kind == 'car') {
    return 'fa fa-car';
  } else if (kind == 'ferry') {
    return 'fa fa-ship';
  } else {
    return 'fa fa-male';
  }
}

function getDurationString(duration, seconds) {
  seconds = typeof seconds !== 'undefined' ? seconds : false;
  var minutes;
  if (seconds) {
    duration = Math.floor(duration / 60);
  } 
  if ((duration % 60) < 10) {minutes = '0' + (duration % 60).toString();} else {minutes = (duration % 60).toString();}
  return Math.floor(duration / 60).toString() + 'h' + minutes;
}

function displayResults(results, handler) {
  var from, to;
  var duration, price, distance;
  var routes;
  var html;
  
  $.each(results, function(key, list) {
    $('#' + key + ' .spinner').css('display', 'none');
    duration = 0, price = 0, distance = 0;
    console.log(key);
      for (var i = 0; i < list.length; i++) {
        for(var j = 0; j < handler.indexes[key].length; j++) {
          if (list[i][0] == handler.indexes[key][j][0][0]) {
            for(var k = 0; k < handler.indexes[key][j].length; k++) {
              if (list[i][1] == handler.indexes[key][j][k][1]) {
                from = list[i][0].split('_');
                to = list[i][1].split('_');
                
                route = handler.data[handler.indexes[key][j][k][2]][handler.indexes[key][j][k][3]][2].routes[handler.indexes[key][j][k][4]];
                distance += route.distance;
                duration += route.duration;
                price += route.indicativePrice.price;
                html = '';
                for (var h = 0; h < route.segments.length; h++) {
                  if (route.segments[h].isMajor == 1)
                    html += '<span class="badge"><span class="' + getGlyph(route.segments[h].kind) +  '"></span></span>';
                }
                $('#' + key + ' .list-group').append('<div class="list-group-item">' + from[0] + ' - ' + to[0] + html + '<br>' +
                                                     getDurationString(route.duration) + '<span class="pull-right">' + route.indicativePrice.price.toString() + ' &euro;</span>' + '</div>');
                html = route.name;
                $('#' + key + ' .list-group').append('<div class="collapse" id="' + key + list[i][0] + '_' + list[i][1] + '">' + html + '</div>');
                
                console.log(list[i][0]);
                console.log(list[i][1]);
                console.log(handler.data[handler.indexes[key][j][k][2]][handler.indexes[key][j][k][3]][2].routes[handler.indexes[key][j][k][4]]);
              }
            }
          }
        }
      }
      html = '<ul class="list-group"><li class="list-group-item"><span class="glyphicon glyphicon-euro"></span> Price: ' + price.toString() + ' &euro;</li>' +
             '<li class="list-group-item"><span class="glyphicon glyphicon-resize-small"></span> Distance: ' + Math.round(distance).toString() + ' kms </li>' +
             '<li class="list-group-item"><span class="glyphicon glyphicon-time"></span> Duration: ' + getDurationString(duration) + '</li></ul>';

      $('#' + key + ' .heading').append(html);
  });
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, toll, highway) {
  var waypts = [];
  for (var i = 0; i < locations.length; i++) {
      waypts.push({
        location: locations[i][0],
        stopover: true
      });
  }

  directionsService.route({
    origin: document.getElementsByClassName('start')[0].textContent,
    destination: document.getElementsByClassName('end')[0].textContent,
    waypoints: waypts,
    optimizeWaypoints: true,
    avoidHighways: highway,
    avoidTolls: toll,
    travelMode: google.maps.TravelMode.DRIVING
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
      var route = response.routes[0];
      var html;
      var distance = 0;
      var duration = 0;
      // For each route, display summary information.
      $('#gmap_response .spinner').css('display', 'none');
      $('#gmap_response .heading, #gmap_response .routes').html('');
      for (var i = 0; i < route.legs.length; i++) {
        if (route.legs[i].start_address != route.legs[i].end_address) {
          distance += route.legs[i].distance.value;
          duration += route.legs[i].duration.value;
          var time_span = route.legs[i].duration.text.split(' ');
          if (parseInt(time_span[2]) < 10) {
            time_span[2] = "0" + time_span[2];
          }
          html = '<div class="list-group-item" type="button">' + route.legs[i].start_address.split(',')[0] + ' - ' + route.legs[i].end_address.split(',')[0] + '<br>' + time_span[0] + 'h' + time_span[2] + '<span class="pull-right">' + Math.round(route.legs[i].distance.value/1000).toString() + ' kms </span>' + '</div>';
          html += '<div class="modal fade" tabindex="-1" role="dialog">' +
                    '<div class="modal-dialog modal-lg">' +
                      '<div class="modal-content">' +
                        '<div class="modal-header">' + 
                          '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span class="close" aria-hidden="true">&times;</span></button>' +
                          '<h4 class="modal-title">' + route.legs[i].start_address.split(',')[0] + ' - ' + route.legs[i].end_address.split(',')[0] + '</h4>' +
                        '</div>' +
                        '<div class="modal-body display_route_map" title="' +route.legs[i].start_address + '_' + route.legs[i].end_address + '"><div class="row">' +
                        '<div class="right-panel"></div><div class="map_modal"></div>' +
                        '</div></div></div></div></div>'
           $('#gmap_response .routes').append(html);
        }
      }
      html = '<ul class="list-group"><li class="list-group-item"><span class="glyphicon glyphicon-resize-small"></span> Distance: ' + Math.round(distance/1000).toString() + ' kms </li>' +
             '<li class="list-group-item"><span class="glyphicon glyphicon-time"></span> Duration: ' + getDurationString(duration, true) + '</li></ul>';
      $('#gmap_response .heading').append(html);
    } else {
      $('#route-warning').modal();
    }
  });
}

function enableSubmit(locations) {
  if (locations.length > 2) {
    if($('#submit').hasClass('disabled')) {
      $('#submit').removeClass('disabled');
    }
  } else {
    if(!$('#submit').hasClass('disabled')) {
      $('#submit').addClass('disabled');
    }
  }
}

function getElementWithAttribute(attribute, id) {
  var allElements = document.getElementsByTagName('*');
  for (var i = 0, n = allElements.length; i < n; i++) {
    if (allElements[i].getAttribute(attribute) == id) {
      return allElements[i];
    }
  }
  return null;
}

function getId(ev) {
  var target = $(ev.target);
  var id = target.parent().attr('id');
  element = getElementWithAttribute('aria-describedby', id);
  return element.closest('a').id;
}

$('body').popover({selector: '[data-popover]', trigger: 'manual', animation: false})
  .on('mouseenter', '#waypoints a .settings' , function () {
    var _this = this;
    $(_this).popover('show');
    $('body').on('mouseenter', '.popover', function(ev) {
      document.getElementById(getId(ev)).className += " selected";
    }).on('mouseleave', '.popover', function () {
      $(_this).popover('destroy');
      $(_this).parent().removeClass("selected");
    });
  }).on('mouseleave', '#waypoints a .settings', function () {
    var _this = this;
    setTimeout(function () {
        if (!$(".popover:hover").length) {
            $(_this).popover('destroy');
        }
    }, 100);
});
  
function initMapModal(map_modal, panel_element, start, end, highway, toll) {
  var directionsDisplay = new google.maps.DirectionsRenderer;
  var directionsService = new google.maps.DirectionsService;
  var map = new google.maps.Map(map_modal, {
    center: {lat: 25, lng: 0},
    zoom: 2
  });
  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(panel_element);

  calculateAndDisplayRouteModal(directionsService, directionsDisplay, start, end, highway, toll);
  
  return {
    map: map,
  }
}

function calculateAndDisplayRouteModal(directionsService, directionsDisplay, start, end, highway, toll) {
  directionsService.route({
    origin: start,
    destination: end,
    avoidHighways: highway,
    avoidTolls: toll,
    travelMode: google.maps.TravelMode.DRIVING
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
    } else {
      $('#route-warning').modal();
    }
  });
}