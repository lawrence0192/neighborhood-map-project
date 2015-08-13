function appViewModel() {
// Alert if Google API is inaccesible
try {
  var dcLoc = new google.maps.LatLng(38.8900, -77.0236);
}
catch(err) {
    alert("Unable to access Google API");
}


  var self = this; 
  var map;
  var service;
  var infowindow;
  var lat = '';
  var lng = '';
  //var dcLoc = new google.maps.LatLng(38.8900, -77.0236);
  var markersArray = [];  
  var $loc = $('#title');

  // Array for Knockout info
  self.allPlaces = ko.observableArray();

  // String for Foursquare info
  self.foursquareInfo = '';

  // Finds the center lat & long values of the map
  function computeCenter() {
    var latAndLng = map.getCenter();
      lat = latAndLng.lat();
      lng = latAndLng.lng(); 
  }

  var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search='+$loc.text()+'&format=json&callback=wikiCallback';
  console.log($loc.text());
    
  self.showLink = function() {
    var wikiRequestTimeout = setTimeout(function(){
      $loc.append("<p>failed to get wikipedia resources</p>");
    }, 3000);
    $.ajax({
     url: wikiUrl,
     dataType: "jsonp",
     success: function (response){
       var articleList = response[1];
       for(i = 0, len = articleList.length; i < len; i++){
        articleStr = articleList[i];
        var url = 'http://en.wikipedia.org/wiki/' + articleStr;
        $loc.append('<p><a href="' + url + '">' + articleStr + '</a></p>');
      
      }
      clearTimeout(wikiRequestTimeout);
    }
    });
  };
  
 
  
  // Loads the map & positions the search bar & list, along with adding & removing map markers
  function initialize() {
    map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: dcLoc,    
    });
    getPlaces();
    computeCenter();       

    var list = (document.getElementById('list'));
    map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(list);
    var input = (document.getElementById('pac-input'));
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    var title = (document.getElementById('title'));
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(title);

    var searchBox = new google.maps.places.SearchBox((input));
    // Filters the results in the pre-populated list
    $('#pac-input').keyup(function(){
      var value = $(this).val().toLowerCase();
      $('li').each(function() {
        var check = $(this).text().toLowerCase();
        if ($(this).text().toLowerCase().search(value) > -1) {
            $(this).show();
        }
        else {
          $(this).hide();
        }
      });
    });
    google.maps.event.addListener(searchBox, 'places_changed', function() {
      var places = searchBox.getPlaces();
      clearOverlays();
      self.allPlaces.removeAll();
      var bounds = new google.maps.LatLngBounds();


      for(var i=0, place; i<10; i++){
        if (places[i] !== undefined){
          place = places[i];

          getAllPlaces(place);
          createMarker(place);
          bounds.extend(place.geometry.location);          
        }        
      } 
      map.fitBounds(bounds); 
      computeCenter();                
    });
    google.maps.event.addListener(map, 'bounds_changed', function(){
      var bounds = map.getBounds();
      searchBox.setBounds(bounds);
    });   
    // Handles an event where Google Maps takes too long to load
    var timer = window.setTimeout(failedToLoad, 10000);
    google.maps.event.addListener(map, 'tilesloaded', function() {
      window.clearTimeout(timer);
    });
  }
  // Will let the user know when Google Maps fails to load
  function failedToLoad() {
    $('#map-canvas').html("Google Maps Failed to Load");
  }

  function apiError() {
    alert("Google API request failed!");
  }

  // Function to pre-populate the map with place types; nearbySearch returns up to 20 places
  function getPlaces() {
    if (!dcLoc){
      apiError();
    }
    else {
      var request = {
        location: dcLoc,
        radius: 600,
        types: ['restaurant', 'bar', 'cafe', 'food']
      };

      infowindow = new google.maps.InfoWindow();
      service = new google.maps.places.PlacesService(map);
      service.nearbySearch(request, callback);
    }
  }

  // Gets the callback from Google and creates a marker for each place
  function callback(results, status){
    if (status == google.maps.places.PlacesServiceStatus.OK){
      bounds = new google.maps.LatLngBounds();
      results.forEach(function (place){
        place.marker = createMarker(place);
        bounds.extend(new google.maps.LatLng(
          place.geometry.location.lat(),
          place.geometry.location.lng()));
      });
      map.fitBounds(bounds);
      results.forEach(getAllPlaces);                 
    }
  }

  // Function to create a marker at each place for the pre-populated list & after each search
  function createMarker(place) {
    var marker = new google.maps.Marker({
      map: map,
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      name: place.name.toLowerCase(),
      position: place.geometry.location,
      place_id: place.place_id,
      animation: google.maps.Animation.DROP
    });    
    var address;
    if (place.vicinity !== undefined) {
      address = place.vicinity;
    } else if (place.formatted_address !== undefined) {
      address = place.formatted_address;
    }       
    var contentString = '<div style="font-weight: bold">' + place.name + '</div><div>' + address + '</div>' + self.foursquareInfo ;

    google.maps.event.addListener(marker, 'click', function() {      
      infowindow.setContent(contentString);      
      infowindow.open(map, this);
      map.panTo(marker.position); 
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function(){marker.setAnimation(null);}, 1450);
    });

    markersArray.push(marker);
    return marker;
  }

  // Foursquare Credentials
  var clientID = 'UVSLUM00CXLUB1P0UKPJSLDTG0VVYQ2E20W1C045PBU1OJNZ';
  var clientSecret = 'JERNMOY0EUXF4LGZTWDLLJFR2CXWDSZWL1JU2W5CS1POPZBF';

  this.getFoursquareInfo = function(point) {
    // Foursquare URL to get Foursquare info
    var foursquareURL = 'https://api.foursquare.com/v2/venues/search?client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20150321' + '&ll=' +lat+ ',' +lng+ '&query=\'' +point.name +'\'&limit=1';
    
    $.getJSON(foursquareURL)
      .done(function(response) {
        self.foursquareInfo = '<p>Foursquare:<br>';
        var venue = response.response.venues[0];         
        // Name       
        var venueName = venue.name;
            if (venueName !== null && venueName !== undefined) {
                self.foursquareInfo += 'Name: ' +
                  venueName + '<br>';
            } else {
              self.foursquareInfo += 'Name: Not Found' + '<br>';
            }   
        // Phone Number     
        var phoneNum = venue.contact.formattedPhone;
            if (phoneNum !== null && phoneNum !== undefined) {
                self.foursquareInfo += 'Phone: ' +
                  phoneNum + '<br>';
            } else {
              self.foursquareInfo += 'Phone: Not Found' + '<br>';
            }
        // Twitter
        var twitterId = venue.contact.twitter;
            if (twitterId !== null && twitterId !== undefined) {
              self.foursquareInfo += 'Twitter: @' +
                  twitterId + '<br>';
            } else {
              self.foursquareInfo += 'Twitter: Not Found' + '<br>';
            }
      })
      
      // Alert if API request to Foursquare fails
      .fail(function() {
        alert("Unable to access Foursquare API");
        self.foursquareInfo = 'Name: Not Found' + '<br>' + 'Phone: Not Found'
        + '<br>' + 'Twitter: Not Found' + '<br>';
      });
  };  
 
  // Function that will pan to the position & open an info window of an item clicked in the list
  self.clickMarker = function(place) {
    var marker;

    for(var i = 0; i < markersArray.length; i++) {      
      if(place.place_id === markersArray[i].place_id) { 
        marker = markersArray[i];
        break; 
      }
    } 
    self.getFoursquareInfo(place);         
    map.panTo(marker.position);

    // Waits 300 milliseconds for the getFoursquare async function to finish
    setTimeout(function() {
      var contentString = '<div style="font-weight: bold">' + place.name + '</div><div>' + place.address + '</div>' + self.foursquareInfo;
      infowindow.setContent(contentString);
      infowindow.open(map, marker); 
      marker.setAnimation(google.maps.Animation.DROP); 
    }, 300);     
  };

  // Function that gets the info for all the places that are going to be searched & pre-populated
  function getAllPlaces(place){
    var myPlace = {};    
    myPlace.place_id = place.place_id;
    myPlace.position = place.geometry.location.toString();
    myPlace.name = place.name;

    var address;    
    if (place.vicinity !== undefined) {
      address = place.vicinity;
    } else if (place.formatted_address !== undefined) {
      address = place.formatted_address;
    }
    myPlace.address = address;
    
    self.allPlaces.push(myPlace);                
  }

  // Called after a search, this function clears any markers in the markersArray so that we can start with fresh map with new markers
  function clearOverlays() {
    for (var i = 0; i < markersArray.length; i++ ) {
     markersArray[i].setMap(null);
    }
    markersArray.length = 0;
  } 

  google.maps.event.addDomListener(window, 'load', initialize);
}

$(function(){
  ko.applyBindings(new appViewModel());
});
