var locations = [];
var modalMaps = [];
var modalSegments = {};

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
    if (placeGet != undefined) {
      if (!place.geometry) {
        $('#search-warning p').html('<span class="glyphicon glyphicon-exclamation-sign"></span> Please select one place in the list.')
        $('#search-warning').modal();
        return;
      } else {
        input.value = "";
        var element = [place.name, place.geometry.location.lat(), place.geometry.location.lng(), place.formatted_address];
        for(var i = 0; i < locations.length; i++) {
          if (locations[i][0] == element[0] && locations[i][1] == element[1] && locations[i][2] == element[2]) {
            $('#search-warning p').html('<span class="glyphicon glyphicon-exclamation-sign"></span> This place is already added.')
            $('#search-warning').modal();
            return
          }
        }
        locations.push(element);
      }
    }
    cleanMap();
    $("#directions-panel .heading, #directions-panel .routes").html('');
    $("#gmap_response .heading, #gmap_response .routes").html('');
    $("#directions-panel").css('display', 'none');
    $('#gmap_response').css('display', 'none');
    $('#gmap_response .spinner').css('display', 'block');
    ["cheapest", "fatest", "shortest"].forEach(function(key) {$('#' + key + ' .spinner').css('display', 'block'); });
    
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
        text += '" id="' + id + '" title="' + locations[i][3] + '"><span class="glyphicon glyphicon-map-marker"></span> ' + locations[i][0] + ' <span class="start-glyph glyphicon glyphicon-home"></span><span class="end-glyph glyphicon glyphicon-flag"></span><span class="glyphicon glyphicon-trash remove pull-right"></span> <span class="glyphicon glyphicon-option-vertical pull-right settings" data-popover="true" data-container="body" data-toggle="popover" data-placement="top" data-html=true data-content="<div class=\'list-group\'><a href=\'#\' class=\'list-group-item start-link\'><span class=\'glyphicon glyphicon-home\'></span> Set as starting point</a><a href=\'#\' class=\'list-group-item end-link\'><span class=\'glyphicon glyphicon-flag\'></span> Set as arriving point</a><div>"></span></a>';
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
  
  document.getElementById('submit').addEventListener('click', function() {
    if ($('#submit').hasClass('disabled')) {
      $('#search-warning p').html('<span class="glyphicon glyphicon-exclamation-sign"></span> You have to add at least three locations.')
      $('#search-warning').modal();
    } else {
      cleanMap();
      $("#directions-panel .heading, #directions-panel .routes").html('');
      $("#gmap_response .heading, #gmap_response .routes").html('');
      if($('input[name="travel-mode"]:checked').val() == 'car') {
        $("#directions-panel").css('display', 'none');
        $('#gmap_response').css('display', 'block');
        directionsDisplay.setMap(map);
        calculateAndDisplayRoute(directionsService, directionsDisplay, toll, highway);
      } else { // transit
        $("#gmap_response").css('display', 'none');
        $("#directions-panel").css('display', 'block');
        $("#tab_cheapest").click();
        transitCall(locations, start_end, function(r) {
          results = r;
          var draw = drawLines(results.cheapest, map);
          poly.cheapest = draw.poly;
          markers_transit.cheapest = draw.markers;
        });
      }
      modalMaps = [];
      var modals = document.getElementsByClassName('display_route_map');
      var getModals = setInterval (function() {
        if ((((modals.length == locations.length && start_end[0] == start_end[1]) || (modals.length == locations.length-1 && start_end[0] != start_end[1])) && $('input[name="travel-mode"]:checked').val() == 'car') ||
            (((modals.length == locations.length*3 && start_end[0] == start_end[1]) || (modals.length == (locations.length-1)*3 && start_end[0] != start_end[1])) && $('input[name="travel-mode"]:checked').val() == 'transit')) {
          clearInterval(getModals);
          for(var i = 0; i < modals.length; i++) {
            var elmModal = {};
            elmModal.title = modals[i].title;
            elmModal.first = true;
            modalMaps.push(elmModal);
          }
        }
      }, 10);
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
      var modal_body = target[0].nextSibling.firstChild.firstChild.childNodes[1];
      for (var i = 0; i < modalMaps.length; i++) {
        if (modalMaps[i].title == modal_body.title) {
          if (modalMaps[i].first) {
            if (modal_body.title.indexOf('#') > -1) {
              var modalMap = new google.maps.Map(modal_body.firstChild.lastChild, {
                center: {lat: 25, lng: 0},
                zoom: 3
              });
              drawLines(modalSegments[modal_body.title], modalMap);
            } else {
              var s_e = modal_body.title.split('_');
              initMapModal(modal_body.firstChild.lastChild, modal_body.firstChild.firstChild, s_e[0], s_e[1], toll, highway);
            }
            modalMaps[i].first = false;
          }
          break;
        }
      }
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
    directionsDisplay.setMap(null);
    setMapOnAll(null);
  }
  
  $('#directions-panel .nav a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
    if($('#cheapest .heading')[0].innerHTML == '') return;
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
  var bounds = new google.maps.LatLngBounds();
  
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
      bounds.extend(position);
    
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
  map.fitBounds(bounds);
  
  return {
    poly: poly,
    markers: markers
  };
}

function transitCall(locations, start_end, callback){
  var handler = new API_handler();
  var matrices = {
    cheapest: [],
    fatest: [],
    shortest: []
  };
  
  var solver = new ATSP();
  var results = {
    cheapest: [],
    fatest: [],
    shortest: []
  };
  
  handler.handle(locations, function() {
    ["cheapest", "fatest", "shortest"].forEach(function(value) {
      if (start_end[0] != start_end[1])
        matrices[value] = handler.addDummyNode(handler.getMatrix(value), start_end[0], start_end[1]);
      else
        matrices[value] = handler.getMatrix(value);
    });
    
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
    callback(results);
  });
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

function getCheapestFlight(itineraries) {
  var min = itineraries[0].legs[0].indicativePrice.price, index = 0;
  for(var i = 1; i <  itineraries.length; i++) {
    if (itineraries[i].legs[0].indicativePrice.price < min) {
      min = itineraries[i].legs[0].indicativePrice.price;
      index = i;
    }
  }
  return [itineraries[index].legs[0].hops[0].airline, itineraries[index].legs[0].hops[0].flight];
}

function displayResults(results, handler) {
  var from, to, from_addr, to_addr;
  var duration, price, distance;
  var routes;
  var html;
  
  $.each(results, function(key, list) {
    $('#' + key + ' .spinner').css('display', 'none');
    duration = 0, price = 0, distance = 0;
      for (var i = 0; i < list.length; i++) {
        for(var j = 0; j < handler.indexes[key].length; j++) {
          if (list[i][0] == handler.indexes[key][j][0][0]) {
            for(var k = 0; k < handler.indexes[key][j].length; k++) {
              if (list[i][1] == handler.indexes[key][j][k][1]) {
                from = list[i][0].split('_');
                to = list[i][1].split('_');
                
                for(var l = 0; l < locations.length; l++) {
                  if (from[0] == locations[l][0] && from[1] == locations[l][1] && from[2] == locations[l][2]) 
                    from_addr = locations[l][3].replace(', ', '-');
                  if (to[0] == locations[l][0] && to[1] == locations[l][1] && to[2] == locations[l][2])
                    to_addr = locations[l][3].replace(', ', '-');
                }
                
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
                var title = key + '#' + list[i][0] + '#' + list[i][1];
                html = '<div class="modal fade" tabindex="-1" role="dialog">' +
                        '<div class="modal-dialog modal-lg">' +
                        '<div class="modal-content">' +
                        '<div class="modal-header">' + 
                        '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span class="close" aria-hidden="true">&times;</span></button>' +
                        '<h4 class="modal-title">' + from[0] + ' - ' + to[0] + '<small> <span class="glyphicon glyphicon-euro"></span> '  + route.indicativePrice.price.toString() + ' &euro; ' + '<span class="glyphicon glyphicon-resize-small"></span> ' + Math.round(route.distance).toString() + ' kms <span class="glyphicon glyphicon-time"></span> ' + getDurationString(route.duration) +'</small></h4>' +
                        '</div>' +
                        '<div class="modal-body display_route_map" title="' + title + '"><div class="row">' +
                        '<div class="right-panel">';
                        
                modalSegments[title] = [];
                modalSegments[title].push(['#']);
                for(var l = 0; l < route.segments.length; l++) {
                  html += '<div><h5>';
                  if (route.segments[l].sName != undefined)
                    html += route.segments[l].sName + ' - ' + route.segments[l].tName;
                  else
                    html += route.segments[l].sCode + ' - ' + route.segments[l].tCode;
                  html += '<span class="badge pull-right"><span class="' + getGlyph(route.segments[l].kind) +  '"></span></span></h5>' +
                          '<div><span class="glyphicon glyphicon-resize-small"></span> ' + Math.round(route.segments[l].distance).toString() + ' kms <span class="glyphicon glyphicon-time"></span> ' + getDurationString(route.segments[l].duration) +'</div>';
                  if (route.segments[l].itineraries != undefined) {
                    if (route.segments[l].itineraries[0].legs[0].host != undefined)
                      html += '<div>Get your tickets on <a href="' + route.segments[l].itineraries[0].legs[0].url + '" target="_blank">' + route.segments[l].itineraries[0].legs[0].host + '</a></div></div><hr>';
                    else {
                      var flight = getCheapestFlight(route.segments[l].itineraries);
                      html += '<div>Looks for the flight <a href="https://www.google.com/search?q=' + flight[0] + '+' + flight[1] + '" target="_blank">' + flight[0] + ' ' + flight[1] + '</a></div></div><hr>';
                    }
                  } else
                    html += '</div><hr>';
                  if (route.segments[l].sPos != undefined) {
                    var loc = route.segments[l].sPos.split(',');
                    modalSegments[title].push([route.segments[l].sName + '_' + loc[0] + '_' + loc[1]]);
                    loc = route.segments[l].tPos.split(',');
                    modalSegments[title].push([route.segments[l].tName + '_' + loc[0] + '_' + loc[1]]);
                  }
                }
                html += '</div><div class="map_modal"></div></div></div><div class="modal-footer">' +
                        '<a href="http://www.rome2rio.com/en/s/' + from_addr + '/' + to_addr + '" target="_blank">Check the road on Rome2io website</a>' +
                        '</div></div></div></div>'
                $('#' + key + ' .list-group').append(html);
              }
            }
          }
        }
      }
      html = '<ul class="list-group"><li class="list-group-item"><span class="glyphicon glyphicon-euro"></span> Price: ' + price.toString() + ' &euro;</li>' +
             '<li class="list-group-item"><span class="glyphicon glyphicon-resize-small"></span> Distance: ' + Math.round(distance).toString() + ' kms </li>' +
             '<li class="list-group-item"><span class="glyphicon glyphicon-time"></span> Duration: ' + getDurationString(duration) + '</li></ul>';
      $('#' + key + ' .heading').append(html);
      $('#directions-panel .tab-content').height($(document).height() - $('.footer').outerHeight() - $('#search-panel').height() - 75 - 42);
  });
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, toll, highway) {
  var waypts = [];
  for (var i = 0; i < locations.length; i++) {
    if (document.getElementsByClassName('start')[0].title != locations[i][3] && document.getElementsByClassName('end')[0].title != locations[i][3]) {
      waypts.push({
        location: locations[i][3],
        stopover: true
      });
    }
  }

  directionsService.route({
    origin: document.getElementsByClassName('start')[0].title,
    destination: document.getElementsByClassName('end')[0].title,
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
      for (var i = 0; i < route.legs.length; i++) {
        if (route.legs[i].start_address != route.legs[i].end_address) {
          distance += route.legs[i].distance.value;
          duration += route.legs[i].duration.value;
          var time_span = route.legs[i].duration.text.split(' ');
          if (parseInt(time_span[2]) < 10) {
            time_span[2] = "0" + time_span[2];
          }
          var from = route.legs[i].start_address.split(', '), to = route.legs[i].end_address.split(', ');
          html = '<div class="list-group-item" type="button">' + from[0] + ' - ' + to[0] + '<br>' + time_span[0] + 'h' + time_span[2] + '<span class="pull-right">' + Math.round(route.legs[i].distance.value/1000).toString() + ' kms </span>' + '</div>';
          html += '<div class="modal fade" tabindex="-1" role="dialog">' +
                    '<div class="modal-dialog modal-lg">' +
                      '<div class="modal-content">' +
                        '<div class="modal-header">' + 
                          '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span class="close" aria-hidden="true">&times;</span></button>' +
                          '<h4 class="modal-title">' + from[0] + ' - ' + to[0] + '</h4>' +
                        '</div>' +
                        '<div class="modal-body display_route_map" title="' + route.legs[i].start_address + '_' + route.legs[i].end_address + '"><div class="row">' +
                        '<div class="right-panel"></div><div class="map_modal"></div>' +
                        '</div></div><div class="modal-footer">' +
                        '<a href="https://www.google.com/maps/dir/' + from[0] + ',+' + from [1] + '/' + to[0] + ',+' + to[1] + '" target="_blank">Check the road on Google Maps website</a>' +
                        '</div></div></div></div>'
           $('#gmap_response .routes').append(html);
        }
      }
      html = '<ul class="list-group"><li class="list-group-item"><span class="glyphicon glyphicon-resize-small"></span> Distance: ' + Math.round(distance/1000).toString() + ' kms </li>' +
             '<li class="list-group-item"><span class="glyphicon glyphicon-time"></span> Duration: ' + getDurationString(duration, true) + '</li></ul>';
      $('#gmap_response .heading').append(html);
      $('#gmap_response .gmap-content').height($(document).height() - $('.footer').outerHeight() - $('#search-panel').height() - $('#gmap_response .page-header').outerHeight() - 75);
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
    zoom: 3
  });
  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(panel_element);

  calculateAndDisplayRouteModal(directionsService, directionsDisplay, start, end, highway, toll);
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

$(function(){ if(window.location.hash) {var hash = window.location.hash;$(hash).modal('toggle');}});