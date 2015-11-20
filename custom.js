var locations = [];

function initMap() {
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;
  var travel_mode = google.maps.TravelMode.DRIVING;
  
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
      text += '<a class="list-group-item" id="' + locations[i][0] + '_' + locations[i][1] + '_' + locations[i][2] + '"><span class="glyphicon glyphicon-map-marker"></span> ' + locations[i][0] + '<span class="glyphicon glyphicon-trash remove pull-right"></span> <span class="glyphicon glyphicon-option-vertical pull-right settings" data-popover="true" data-container="body" data-toggle="popover" data-placement="top" data-html=true data-content="<div class=\'list-group\'><a href=\'#\' class=\'list-group-item\'><span class=\'glyphicon glyphicon-home\'></span> Set as starting point</a><a href=\'#\' class=\'list-group-item\'><span class=\'glyphicon glyphicon-flag\'></span> Set as arriving point</a><div>"></span></a>';
    }
    
    if (locations.length == 1) {
      map.setCenter(markers[0].position);
      map.setZoom(12);
    } else if (locations.length == 0) {
      map.setCenter({lat: 25, lng: 0});
      map.setZoom(2);
    } else {
      map.fitBounds(bounds);
    }
    document.getElementById('waypoints').innerHTML = text;
  }

  autocomplete.addListener('place_changed', function() {setMarkers(autocomplete.getPlace())});
  
  // Sets a listener on a radio button to change the filter type on Places
  // Autocomplete.
  function setupClickListener(id, mode) {
    var radioButton = document.getElementById(id);
    radioButton.addEventListener('click', function() {
      travel_mode = mode;
    });
  }
  setupClickListener('changemode-driving', google.maps.TravelMode.DRIVING);
  setupClickListener('changemode-transit', google.maps.TravelMode.TRANSIT);
  setupClickListener('changemode-bicycling', google.maps.TravelMode.BICYCLING);
  setupClickListener('changemode-walking', google.maps.TravelMode.WALKING);
  
  directionsDisplay.setMap(map);
  
  document.getElementById('submit').addEventListener('click', function() {
    calculateAndDisplayRoute(directionsService, directionsDisplay, travel_mode);
  });
  
  $(document).on('mouseenter', '#waypoints a', function() {$(this).addClass("selected");});
  $(document).on('mouseleave', '#waypoints a', function() {$(this).removeClass("selected");});
  $(document).on('click', '#waypoints a .remove', function() {
    for(var i = 0; i < locations.length; i++) {
      if ($(this).parent().attr('id') == locations[i][0] + '_' + locations[i][1] + '_' + locations[i][2]) {
        locations.splice(locations.indexOf(i), 1);
        break;
      }
    }
    setMarkers(undefined);
  });
  
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
  //$('body').popover({selector: '[data-popover]', trigger: 'click hover', delay: {show: 50, hide: 10}});
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
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, travel_mode) {
  var waypts = [];
  for (var i = 0; i < locations.length; i++) {
      waypts.push({
        location: locations[i][0],
        stopover: true
      });
  }

  directionsService.route({
    origin: document.getElementById('start').value,
    destination: document.getElementById('start').value,
    waypoints: waypts,
    optimizeWaypoints: true,
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