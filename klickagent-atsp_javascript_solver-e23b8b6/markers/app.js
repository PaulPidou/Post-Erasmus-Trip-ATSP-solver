var features = [];
var waypoints = [];

var generateRandomMarkers = function(x){
	
	var rand, i;
	for ( i = 0; i < x ; i++){
		rand = chance.coordinates({fixed: 2});
		rand = rand.split(', ');
		rand = [parseFloat(rand[0]),parseFloat(rand[1])];
		waypoints.push( rand );
	}
	addMarkers(waypoints);
};


var addMarkers = function( waypoints , order ){
	destroyFeatures();
	var order_array = true;
	if( !order ){
		order = waypoints;
		order_array = false;
	}
	var c,i,j;
	for( i in order ){
		j = order_array ? order[i] : i;
		c = waypoints[j];
		addMarker( c, i );
	}
	
};

var addMarker = function(latLngArray,i){
	i++;
	
	var latLng = ol.proj.transform(latLngArray,map_meta.proj_app,map_meta.proj_map);
	var feature = new ol.Feature({
		geometry: new ol.geom.Point(latLng),
		waypoint: { }, 
		 
	});
	feature.setStyle(
		new ol.style.Style({
			image: new ol.style.Icon({
			    anchor: [16, 30],
			    //anchorXUnits: 'fraction',
			    anchorYUnits: 'pixels',
			    anchorXUnits: 'pixels',
			    opacity: 0.75,
			    src: 'http://maps.klickagent.ch/1.0/resources/php/generateMarker.api.php?txt='+i+'&fontSize=11&bgcolor=61_91_19_1&color=255_255_255&type=default&height=30&width=30&txtPosX=&txtPosY=&txtAlignX=center&txtAlignY=center&cache=true'
			}),
			
		})
	);
	features.push(feature);
	layer1.getSource().addFeature(feature);
};

var destroyFeatures = function(){
	for( var i in features ){
		layer1.getSource().removeFeature(features[i]);
		delete(features[i]);
	}
	waypoints = [];
};
