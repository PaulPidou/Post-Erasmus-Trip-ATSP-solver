var locations = [];

function initMap() {
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;
  var travel_mode = google.maps.TravelMode.DRIVING;
  
  var toll = false, highway = false;
  var start_end = ['', ''];
  
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
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
    markers = [];
  }
  
  function setMarkers(placeGet) {
    var place = placeGet;
    if (place == undefined) {
      // An element has been remove
      setMapOnAll(null);
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
  
  // Sets a listener on a radio button to change the filter type on Places
  // Autocomplete.
  function setupClickListener(id, mode) {
    var radioButton = document.getElementById(id);
    radioButton.addEventListener('click', function() {
      travel_mode = mode;
    });
  }
  setupClickListener('changemode-driving', google.maps.TravelMode.DRIVING);
  setupClickListener('changemode-bicycling', google.maps.TravelMode.BICYCLING);
  setupClickListener('changemode-walking', google.maps.TravelMode.WALKING);
  
  directionsDisplay.setMap(map);
  
  document.getElementById('submit').addEventListener('click', function() {
    if ($('#submit').hasClass('disabled')) {
      $('#search-warning p').html('<span class="glyphicon glyphicon-exclamation-sign"></span> You have to add at least two locations.')
      $('#search-warning').modal();
    } else {
      calculateAndDisplayRoute(directionsService, directionsDisplay, travel_mode, toll, highway);
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
    document.getElementById('directions-panel').innerHTML = '';
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
    enableSubmit();
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
  
  function enableSubmit(locations) {
    if (locations.length > 1) {
      if($('#submit').hasClass('disabled')) {
        $('#submit').removeClass('disabled');
      }
    } else {
      if(!$('#submit').hasClass('disabled')) {
        $('#submit').addClass('disabled');
      }
    }
  }
  
  $("#rome2rio").click(function(){
    var handler = new API_handler();
    //handler.handle(locations);
    handler.data = data_test;
    var matrices = [];
    ["cheapest", "fatest", "shortest"].forEach(function(value) {
      if (start_end[0] != start_end[1]) {
        matrices.push(handler.addDummyNode(handler.getMatrix(value), start_end[0], start_end[1]));
      } else {
        matrices.push(handler.getMatrix(value));
      }
    });
    //console.log(handler.data);
    //console.log(handler.indexes);
        
    var solver = new ATSP();
    for (var i = 0; i < matrices.length; i++) {
      solver.anneal(matrices[i]);
      console.log(solver.currentOrder);
      for (var j = 0; j < solver.currentOrder.length - 1; j++) {
        console.log(matrices[i][solver.currentOrder[j]][solver.currentOrder[j + 1]]);
      }
      console.log(matrices[i][solver.currentOrder[solver.currentOrder.length - 1]][solver.currentOrder[0]]);
      console.log(solver.shortestDistance);
    }
  });
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, travel_mode, toll, highway) {
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
    travelMode: travel_mode
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
      var route = response.routes[0];
      var summaryPanel = document.getElementById('directions-panel');
      summaryPanel.innerHTML = '';
      // For each route, display summary information.
      for (var i = 0; i < route.legs.length; i++) {
        var routeSegment = i + 1;
        summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment +
            '</b><br>';
        summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
        summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
        summaryPanel.innerHTML += route.legs[i].distance.text + '<br><hr>';
      }
      summaryPanel.style.height = window.innerHeight - document.getElementById("search-panel").offsetHeight - 95 + "px";
    } else {
      $('#route-warning').modal();
    }
  });
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