      var map;
      var InfoWindow;

      function initialize() {
      	var loc = new google.maps.LatLng(-34.397, 150.644)
        var mapOptions = {
          center: loc,
          zoom: 15
        };
        var map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);
        var request = {
        	location : loc,
        	radius: 600,
        	types: ['bar', 'school', 'restaurant']
        };
        infowindow = new google.maps.InfoWindow();
        var service = new google.maps.places.PlacesServices(map);
        service.nearbySearch(request, callback);
      }

      google.maps.event.addDomListener(window, 'load', initialize);