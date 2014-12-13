// MapBox Locator
// 
// Copyright (c), Development Seed
// All rights reserved.

// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

// Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
// Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
// Neither the name "Development Seed" nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// ----------------------------------------------------------------------------
// Helper functions

function getURLParameter(name) {
  return decodeURI(
    (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
  );
}

// ----------------------------------------------------------------------------
// Icons: https://www.mapbox.com/maki

var maki = ['','circle', 'circle-stroked', 'square', 'square-stroked', 'triangle', 'triangle-stroked', 'star', 'star-stroked', 'cross', 'marker', 'marker-stroked', 'religious-jewish', 'religious-christian', 'religious-muslim', 'cemetery', 'airport', 'heliport', 'rail', 'rail-underground', 'rail-above', 'bus', 'fuel', 'parking', 'parking-garage', 'london-underground', 'airfield', 'roadblock', 'ferry', 'harbor', 'bicycle', 'park', 'park2', 'museum', 'lodging', 'monument', 'zoo', 'garden', 'campsite', 'theatre', 'art', 'pitch', 'soccer', 'america-football', 'tennis', 'basketball', 'baseball', 'golf', 'swimming', 'cricket', 'skiing', 'school', 'college', 'library', 'post', 'fire-station', 'town-hall', 'police', 'prison', 'embassy', 'beer', 'restaurant', 'cafe', 'shop', 'fast-food', 'bar', 'bank', 'grocery', 'cinema', 'pharmacy', 'hospital', 'minefield', 'industrial', 'warehouse', 'commercial', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

// ----------------------------------------------------------------------------
// Locator
// Barebones generator for widgetization of maps

(function($){

  function init() {
    var model = new Backbone.Model();
    
    var locator = new Locator({
        model: model,
        el: $('body')
    });
    
  }
  
  var Locator = Backbone.View.extend({    
    
    events: {
      'click #add-marker': 'toggleAddingMarker',
      'click #save-marker': 'toggleSaveMarker',
      'click #delete-marker': 'deleteMarker',
      'click #cancel-marker': 'toggleCancelMarker',
      'click .show-all': 'showAll',
      'click #generate-image': 'generateImage',
      'click #generate-embed': 'generateEmbed',
      'change .change-size': 'changeMapSize',
      'click #toggle-location': 'toggleLocation',
      'click #share-location': 'shareLocation',
      'click #clear-cookie': 'clearCookie',
      'click #home-url': 'toggleMenu'
    },

    initialize: function(){
      _(this).bindAll(
        'addMarker',
        'initMapSize',
        'changeMapSize',
        'deleteMarker',
        'generateUrlString',
        'generateImage',
        'generateEmbed',
        'placeMarker',
        'renderMap',
        'showAll',
        'toggleError',
        'toggleAddingMarker',
        'toggleCancelMarker',
        'toggleEditScreen',
        'toggleSaveMarker',
        'updateMarker',
        'createLocationMarker',
        'updateCurrentLocationMarker',
        'updateShare',
        'shareLocation',
        'loadCookie',
        'updateCookie',
        'loadMarkers',
        'getMarkerIndex',
        'checkForShare',
        'cancelShareAutoUpdate',
        'resumeShareAutoUpdate',
        'updateMarkers',
        'toggleLocation'
      );

      this.model.on('change:activeMarker', this.toggleEditScreen);

      // Insert your Map ID here
      var mapId = 'username.mapIdentifier';
      this.model.set('mapId', mapId);

      this.model.set('coords',{
      	// New York
        lat: '40.7364',
        lon: '-73.9792'
      });
      
        // Fill in Maki options
      $markerSymbols = $('#marker-icon');
      $.each(maki, function(icon){
        $markerSymbols.append('<option value="' + maki[icon] +'">' + maki[icon] + '</option>');
      })
      
      
      if (!window.location.origin) {
          window.location.origin = window.location.protocol+"//"+window.location.host;
      }
      //$('#home-url').prop("href", window.location.origin);
      
      var user = { 
          locationData: [],
          maps: [],
          curLocMkr: null,
          markers: [],
          username: null,
          password: null,
          userID: this.uniqID(),
          track: false
      }
      this.model.set('user', user);
      
      var sharedMap = {
          sid: null, 
          coords: {lat: null, lon: null}, 
          curLocMkr: null,
          markers: [] 
      };
      this.model.set('sharedMap', sharedMap);
      var shareData = { 
          sid: null, 
          time: null, 
          active: false
      } ;
      this.model.set('share', shareData);
      
      this.loadCookie();     
      this.initMapSize();
      this.renderMap(mapId);
      this.placeMarker();
      //this.loadMarkers();
      this.updateMarkers();
      this.checkForShare();
    },
    
    loadMarkers: function () {
        var user = this.model.get('user');
        
        if (user.markers.length > 0) {
            this.markerLayer.features(this.markerLayer.features().concat(user.markers));
        }
        if (user.curLocMkr !== null) {
            this.markerLayer.features(this.markerLayer.features().concat(user.curLocMkr));
        }                
    },
    
    toggleMenu: function () {
        $('#content').slideToggle('fast');
    },
    
    clearCookie: function () {
        docCookies.removeItem("oMCookie");
        window.location.reload();
    },
    
    loadCookie: function () {
	var cookieData = docCookies.getItem("oMCookie");
        
	if ( cookieData !== null) {
            cookieData = JSON.parse(cookieData);
            
            this.model.set(cookieData);
            
            if (this.model.has('user')) {
                var user = this.model.get('user');
                if (user.track) {
                    user.track = false;
                    this.model.set('user', user);
                    this.toggleLocation();
                }
            }
            
             if (this.model.has('share')) {
                var share = this.model.get('share');
                if (share.active) {
                    this.shareLocation();
                }
            }
            return true;		
	} else { return false; }
	
    },
    
    updateCookie: function () {
        var cookieData = this.model.toJSON();
        docCookies.setItem("oMCookie", JSON.stringify(cookieData), Infinity);
    },
    
    getURLParams: function () {
        var qsParm = new Array();
        var query = window.location.search.substring(1);
        var parms = query.split('&');
        for (var i=0; i<parms.length; i++) {
            var pos = parms[i].indexOf('=');
            if (pos > 0) {
                var key = parms[i].substring(0,pos);
                var val = parms[i].substring(pos+1);
                qsParm[key] = val;
            }
        }
        return qsParm;
    },
    
    checkForShare: function () {
        var urlParams = this.getURLParams();
        if (typeof(urlParams['sid']) !== 'undefined') {
            $('#shared-map').show().html('Shared map ID: ' + urlParams['sid']);
            var sharedMap = this.model.get('sharedMap');
            sharedMap.sid = urlParams['sid'];
            this.model.set('sharedMap', sharedMap);
            this.getSharedMarkers(urlParams['sid']);
        
            if (typeof(urlParams['autoupdate']) !== 'undefined') {
                this.model.set('updateRate', parseFloat(urlParams['autoupdate']));
            } else {
                this.model.set('updateRate', 60);
            }
            this.cancelShareAutoUpdate();
            var handle = this;
            this.model.set('autoUpdateID', setInterval(function () { 
                    handle.getSharedMarkers(urlParams['sid']); 
                } , 1000*this.model.get('updateRate')));    
        }
    },
    
    cancelShareAutoUpdate: function () {
        if (this.model.has('autoUpdateID')) {
          clearInterval(this.model.get('autoUpdateID'));
          this.model.unset('autoUpdateID');
        }
    },
    
    resumeShareAutoUpdate: function () {
        var handle = this;
        if (this.model.has('sharedMap') && this.model.has('updateRate')) {
            this.model.set('autoUpdateID', setInterval(function () { 
                handle.getSharedMarkers(handle.model.get('sharedMap').sid); 
            } , 1000*this.model.get('updateRate')));  
        }
        
    },
    
    setSharedMarkers: function (sharedData) {
        var sharedMap = this.model.get('sharedMap');
        var sharedData = JSON.parse(sharedData);
        sharedMap.curLocMkr = sharedData.curLocMkr;
        sharedMap.markers = sharedData.markers;
        sharedMap.coords = sharedData.coords;
        this.model.set('sharedMap', sharedMap);
        var markers = [];
        if (this.model.get('user').curLocMkr !== null) {
            markers = markers.concat(this.model.get('user').curLocMkr);
        }
        markers = markers.concat(this.model.get('user').markers);
        if (sharedMap.curLocMkr !== null) {
            markers = markers.concat(sharedMap.curLocMkr);
        }
        if (sharedMap.markers !== null) {
            markers = markers.concat(sharedMap.markers);
        }
        this.markerLayer.features([]);
        this.markerLayer.features(markers);
        
    },
    
    getSharedMarkers: function (sid) {
        var sid = { sid: sid} ;
        var handle = this;
        handle.queryServer(sid, 'getSharedMarkers.php', function (response){
                handle.setSharedMarkers(response);
            });
    },
    
    uniqID: function (prefix) {
        if (typeof(prefix) === 'undefined') prefix = '';
	var size = 10;
	var str = "";
	for(var i = 0; i < size; i++)
	{
		str += this.getRandomChar();
	}
	return prefix + str;
    },
    
    getRandomChar: function() {
        var chars = "0123456789ABCDEFGHIJKLMNOPQURSTUVWXYZ012345678901234567890123456789";
	return chars.substr( Math.floor(Math.random() * chars.length), 1 );
    },

    /*
    *	Communicate with server
    */
    queryServer: function (dataToSend, phpFilename, callback) {
        var params = "data="+JSON.stringify(dataToSend);
        var http = new XMLHttpRequest();
        var phpfolder = './php/';
        var url = phpfolder + phpFilename;
        http.open("POST", url, true);
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.onreadystatechange = function() {
                if(http.readyState == 4 && http.status == 200) {
                        callback(http.responseText);
                }
        }
        http.send(params);
    },
    
    shareLocation: function () {        
        var toggleError = this.toggleError;
        if ($('#share-location').hasClass('blue')) {
            $('#share-location').removeClass('blue');
            $('#share-location').addClass('red');
            $('#share-location').html('Stop Sharing');
            if (this.model.get('share').sid === null) {
                var sid = this.uniqID();
                var addShareData = { 
                    sid: sid, 
                    time: (new Date()).getTime(), 
                    active: true
                } ;
                this.model.set('share', addShareData);
                this.queryServer(addShareData, 'createShare.php', function (response){
                    //toggleError(response);
                });
            } else {
                var shareData = this.model.get('share');
                shareData.active = true;
                this.model.set('share', shareData);
            }
            $('#share-info').slideDown('fast');
            $('#share-url').prop("href", "mailto:?subject=ownMapp%20Link%20&body=" + window.location.origin + '/index.php?sid='+this.model.get('share').sid + "&autoupdate=10");
            this.updateCookie();
        } else {
            $('#share-location').removeClass('red');
            $('#share-location').addClass('blue');
            $('#share-location').html('Share');
            var shareData = this.model.get('share');
            shareData.active = false;
            this.model.set('share', shareData);
            this.updateCookie();
            $('#share-info').slideUp('fast');
        }
    },
    
    getMyMarkers: function () {
        var allMarkers = this.markerLayer.features();
        if (allMarkers === null || allMarkers.length === 0 ) { 
            return [];
        }
        var sharedMarkerIDs = [];
        var myMarkers = [];
        var curLocMkrID = 0;
        if (this.model.get('user').curLocMkr !== null) {
            curLocMkrID = this.model.get('user').curLocMkr.properties.id;
        }
        if (this.model.has('sharedMap')) {
            var sharedMarkers = this.model.get('sharedMap').markers;
            if (this.model.get('sharedMap').curLocMkr !== null) {
                sharedMarkers.push(this.model.get('sharedMap').curLocMkr);
            }
            for (var i=0; i<sharedMarkers.length; i++) { 
                sharedMarkerIDs.push(sharedMarkers[i].properties.id);
            } 
        }
            
        for (var i=0; i<allMarkers.length; i++) {      
            if (sharedMarkerIDs.indexOf(allMarkers[i].properties.id) === -1
                    && allMarkers[i].properties.id !== curLocMkrID) {
                myMarkers.push(allMarkers[i]);
            }
        }
        
        return myMarkers;
        
    },
    
    updateShare: function () { 
        var coords = this.model.get('coords');
        var toggleError = this.toggleError;
        var updateShareData = { sid: this.model.get('share').sid, 
            coords: coords, 
            time: (new Date()).getTime(),
            curLocMkr: this.model.get('user').curLocMkr,
            markers: this.model.get('user').markers
        } ;
        this.queryServer(updateShareData, 'updateShare.php', function (response){
            });
    },
    
    updateMarkers: function () {
        var user = this.model.get('user');
        this.markerLayer.features([]);
        this.markerLayer.features(this.markerLayer.features().concat(user.markers));
        if (user.curLocMkr !== null) {
            this.markerLayer.features(this.markerLayer.features().concat(user.curLocMkr));
        }
        if (this.model.get('sharedMap').sid !== null) {
            this.getSharedMarkers(this.model.get('sharedMap').sid);
            
        }
        this.updateCookie();
    },
    
    toggleLocation: function () {
        var handle = this;
        if (!(this.model.get('user').track)) {
            if (navigator.geolocation) {
                var user = this.model.get('user');
                user.track = true;
                this.model.set('user', user);
                var geo_options = {enableHighAccuracy: true, maximumAge: 30000, timeout: 600000};
                var handle = this;
                var watchID = navigator.geolocation.watchPosition(
                    function(position) {
                        var coords = {lat: position.coords.latitude, lon: position.coords.longitude};
                        $('#coordinates').slideDown('fast').html(coords.lat +','+ coords.lon);
                        handle.model.set('coords', coords);
                        var locData = {
                            lat: position.coords.latitude, 
                            lon: position.coords.longitude, 
                            accuracy: position.coords.accuracy, 
                            updateTime: (new Date()).getTime() 
                        };
                        var user = handle.model.get('user');
                        user.locationData.push(locData);
                        handle.model.set('user', user);
                        if (user.curLocMkr === null) {
                            handle.createLocationMarker(coords);
                        } else {
                            handle.updateCurrentLocationMarker();
                        }
                        if (handle.model.get('share').active) {
                            handle.updateShare();
                        }
                    }, 
                    function(error) {
                        $('#coordinates').show().html(error);
                    }, geo_options);
                handle.model.set('watchID', watchID);
            }
            else {
                $('#coordinates').show().html('Geolocation is not supported by this browser.');
            }  
        }
        else {
            var watchID = handle.model.get('watchID');
            navigator.geolocation.clearWatch(watchID);
            handle.model.unset('watchID');
            window.console.log('Cleared watchID');
            $('#coordinates').slideUp('fast');
            var user = handle.model.get('user');
            window.console.log('user.track: ' + user.track);
            user.track = false;
            handle.model.set('user', user);
            user = handle.model.get('user');
            window.console.log('user.track: ' + user.track);
            handle.updateCookie();
        }
        
    },
    
    createLocationMarker: function(coords) {
        var newMarkerID = this.uniqID();
        // Place marker at point
        this.markerLayer.add_feature({
          geometry: {
            coordinates: [coords.lon, coords.lat]
          },
          properties: {
            'marker-color': 'dc463f',
            'marker-symbol': 'star',
            className: '',
            description: ' ',
            title: 'Me',
            id: newMarkerID
          }
        });
        var user = this.model.get('user');
        user.username = 'Me';
        user.curLocMkr = this.getMarkerByID(newMarkerID);
        // Set active marker
        this.model.set('user', user);
        this.map.center({ lat: coords.lat, lon: coords.lon }, true);
        this.updateCookie();
    },
    
    updateCurrentLocationMarker: function() {
        var coords = this.model.get('coords');
        var markers = this.markerLayer.features();
        var user = this.model.get('user');
        user.curLocMkr.geometry['coordinates'] =  [coords.lon, coords.lat];
        var dt = new Date();
        var dateString =  dt.getFullYear() + '/' + ('0' + (dt.getMonth()+1)).slice(-2) + '/' + ('0' + dt.getDate()).slice(-2) + ' ' + ('0' + (dt.getHours()+1)).slice(-2)+ ':' + ('0' + (dt.getMinutes()+1)).slice(-2)+ ':' + ('0' + (dt.getSeconds()+1)).slice(-2);
        user.curLocMkr.properties.description = '<center> <br>'+ dateString + '</center>';

        this.model.set('user', user);
        this.updateMarkers();
        this.updateCookie();
    },
    
    addMarker: function(coords) {
      var newMarkerID = this.uniqID();
      // Place marker at point
      var newMarker = {
        geometry: {
          coordinates: [coords.lon, coords.lat]
        },
        properties: {
          'marker-color': '0000FF',
          'marker-symbol': '',
          className: '',
          description: '',
          id: newMarkerID
        }
      };
      var user = this.model.get('user');
      user.markers.push(newMarker);
      this.model.set('user', user);
      this.markerLayer.add_feature(newMarker);
     
      this.map.center({ lat: coords.lat, lon: coords.lon }, true);

      // Set active marker
      this.model.set('activeMarker',newMarkerID);

      // Change state back
      $('body').removeData('state');

    },

    changeMapSize: function() {
      var width = $('#map-width').val(),
          height = $('#map-height').val();

      this.model.set('mapWidth',width);
      this.model.set('mapHeight',height);

      $('#map-wrapper').css({
        'width' : width,
        'height': height
      });

      this.map.dimensions.x = width;
      this.map.dimensions.y = height;
      this.map.center();
      this.map.draw();
      
    },
    
    getMarkerIndex: function (markerID) {
        if (typeof(this.markerLayer) !== 'undefined') {
            var markers = this.markerLayer.features();
            for (i=0; i<markers.length; i+=1) {
                  if (markers[i].properties.id === markerID) {
                      return i;
                  }
              }
             
        }
       return -1;
    },
    
    getMarkerByID: function (markerID) {
      var markers = this.markerLayer.features();
      for (i=0; i<markers.length; i+=1) {
            if (markers[i].properties.id === markerID) {
                return markers[i];
            }
        }
       return null;
    },
    
    deleteUserMarker: function (markerID) {
        var user = this.model.get('user');
        for (var i=0; i<user.markers.length; i++) {      
            if (user.markers[i].properties.id === markerID) {
                user.markers.splice(user.markers[i], 1);
                this.model.set('user', user);
                return;
            }
        }        
    },
    
    deleteMarker: function() {
      var markers = this.markerLayer.features(),
          markerId = this.getMarkerIndex(this.model.get('activeMarker'));
      var user = this.model.get('user');
      if (user.curLocMkr !== null) {
          if (user.curLocMkr.properties.id === this.model.get('activeMarker')) {
              user.curLocMkr = null;
              this.model.set('user', user);
          }
      }
      this.deleteUserMarker(this.model.get('activeMarker'));
      // Reset activeMarker
      this.model.unset('activeMarker');
      
      this.updateMarkers();
      
      if (this.model.has('share') && this.model.get('share').active) {
          this.updateShare();
      }
      
      this.updateCookie();
      this.resumeShareAutoUpdate();
    },

    generateUrlString: function(includeTooltips) {

      // Map vars
      var urlString = this.model.get('mapId') + '/',
          lon = this.map.center().lon,
          lat = this.map.center().lat;
          zoom = this.map.zoom(),
          mapString = lon + ',' + lat + ',' + zoom,
          markerString = '',
          includeTooltips = includeTooltips || false;

      // Marker vars
      $.each(this.markerLayer.features(),function(){
        var marker = {
          'name':   'pin-m',
          'label':  this.properties['marker-symbol'],
          'color':  this.properties['marker-color'],
          'lon':    this.geometry.coordinates[0],
          'lat':    this.geometry.coordinates[1],
          'className': this.properties['className']
        };

        if(marker.label !== '') {
          marker['label'] = '-' + marker.label;
        }

        if(marker['className'].indexOf('hide') < 0) {
          markerString += marker.name + marker.label + '+' + marker.color + '(' + marker.lon + ',' + marker.lat + ')';

          if(includeTooltips) {
            markerString += '+' + encodeURIComponent(marker.tooltip);
          }

          markerString += ',';
        }

      });

      if(markerString) {
        urlString += markerString.slice(0,-1) + '/';
      }

      urlString += mapString;

      return urlString;

    },

    generateImage: function() {

      var apiString = 'https://api.tiles.mapbox.com/v3/',
          urlString = this.generateUrlString(),
          mapWidth = this.map.dimensions.x,
          mapHeight = this.map.dimensions.y;

      var requestString = apiString + urlString + '/' + mapWidth + 'x' + mapHeight + '.png';

      if(mapWidth > 640 || mapHeight > 640) {
        this.toggleError('<strong>Whoops!</strong> Map must be smaller than 640 x 640 to generate an image.');
        return false;
      } else this.toggleError();

      $('#share-code').slideDown('fast');
      $('#generate-result').val(requestString).select();

    },

    generateEmbed: function() {
      var mapId = this.model.get('mapId'),
          lon = this.map.center().lon,
          lat = this.map.center().lat;
          zoom = this.map.zoom(),
          mapWidth = this.model.get('mapWidth'),
          mapHeight = this.model.get('mapHeight'),
          $container = $('<div></div>'),
          $mapContainer = $('<div class="mapbox-map"></div>');

      if(mapWidth === undefined || mapWidth === '') {
        mapWidth = '100%';
      } else mapWidth += 'px';

      if(mapHeight === undefined || mapHeight === '') {
        mapHeight = '100%';
      } else mapHeight +='px';

      $mapContainer
        .attr({
          'data-mapId': mapId,
          'data-lon':   lon,
          'data-lat':   lat,
          'data-zoom':  zoom,
          'data-width': mapWidth,
          'data-height': mapHeight
        })
      
      $.each(this.markerLayer.features(),function(){

        if(this.properties['className'].indexOf('hide') < 0) {

          var $marker = $('<div class="marker"></div>');
          $marker.attr({
            'data-name'   : 'pin-m',
            'data-symbol'  : this.properties['marker-symbol'],
            'data-color'   : this.properties['marker-color'],
            'data-lon'    : this.geometry.coordinates[0],
            'data-lat'    : this.geometry.coordinates[1],
            'data-tooltip': encodeURIComponent(this.properties['description'])
          });

          $mapContainer.append($marker);
        }
      });

      $container.append($mapContainer);

      $container.append('<script async src="//mapbox.com/locator/embed.js" charset="utf-8"></script>');

      $('#share-code').slideDown('fast');
      $('#generate-result').val($container.html()).select();

    },

    initMapSize: function() {
      var model = this.model;

      $('input[name="size"]').change(function(){
        var size = $(this).data('size');

        model.set('mapWidth',size);
        
      });
        
    },

    placeMarker: function() {
      var map = this.map,
          addMarker = this.addMarker;
      
      MM.addEvent(map.parent, 'mousedown', function(e) {
          var ev = e,
              px = MM.getMousePoint(ev, map);

          place(ev,px);
      });
  
      MM.addEvent(map.parent, 'touchstart', function(e) {
          points = _.map(e.touches, function(t) { return [ t.screenX , t.screenY ]; });
          var pts = points[0];
       
          var ev = e,
              px = {x: pts[0], y: pts[1]};
          
          place(ev,px);
      });

      var place = function(ev,px) {

          if($('body').data('state') != 'adding-marker') {
            return;
          }

          px = {
              x: px.x,
              y: px.y
          };
          var clickPosition = map.pointLocation(px);

          var $loader = $('<div id="placing"></div>');
          $('#map').append($loader);

          $loader.css({
              'left':px.x - 25 + 'px',
              'top':px.y - 25 + 'px'
          });

          // After 0ms of pressing, place pin
          var timer = setTimeout(function(){    
              
              addMarker(clickPosition);

              $loader.remove();
              
          }, 0);

          // Clear timer on mouse up

          $loader.mouseup(function() {
            clearTimeout(timer);
            $loader.remove();
          });

          MM.addEvent(ev.target, 'mouseup', function(e) {
              clearTimeout(timer);
              $loader.remove();
          });

          MM.addEvent(ev.target, 'mousemove', function(e) {
            clearTimeout(timer);
            $loader.remove();
          });
          
      };

    },

    renderMap: function(mapId){
      var coords = this.model.get('coords'),
          toggleEditScreen = this.toggleEditScreen,
          model = this.model;

      this.map = mapbox.map('map');
      this.map.addLayer(mapbox.layer().url('https://a.tiles.mapbox.com/v3/' + mapId + '.jsonp?secure'));

      // Create an empty markers layer
      this.markerLayer = mapbox.markers.layer().factory(function(f) {
        var elem = mapbox.markers.simplestyle_factory(f);

        elem.id = "marker-" + f.properties.id;
        elem.className = 'simplestyle-marker' + f.properties.className;
        elem['marker-symbol'] = 'circle';

        MM.addEvent(elem, 'click', function(e) {
          model.set('activeMarker', f.properties.id);
        });

        MM.addEvent(elem, 'touchstart', function(e) {
          model.set('activeMarker', f.properties.id);
        });
        
        return elem;
      });
      // Overwrite extent function to account for the hiding of markers
      // as in the deleteMarker function
      this.markerLayer.extent = _(function() {
          var ext = [{
              lat: Infinity,
              lon: Infinity
          }, {
              lat: -Infinity,
              lon: -Infinity
          }];
          var ft = this.markerLayer.features();
          for (var i = 0; i < ft.length; i++) {
              var coords = ft[i].geometry.coordinates,
                  className = ft[i].properties.className;
              if(className.indexOf('hide') < 0) {
                if (coords[0] < ext[0].lon) ext[0].lon = coords[0];
                if (coords[1] < ext[0].lat) ext[0].lat = coords[1];
                if (coords[0] > ext[1].lon) ext[1].lon = coords[0];
                if (coords[1] > ext[1].lat) ext[1].lat = coords[1];
              }
          }
          return ext;
      }).bind(this);

      mapbox.markers.interaction(this.markerLayer);
      this.map.addLayer(this.markerLayer);

      // Set sorting method
      this.markerLayer.sort(function(a, b) {
          return a.properties.id -
            b.properties.id;
      });

      // Basic UI Controls
      this.map.ui.zoomer.add();
      this.map.ui.zoombox.add();
      this.map.ui.attribution.add()
          .content('<!--<a href="https://mapbox.com/about/maps">Terms &amp; Feedback</a>-->');
      
      this.map.zoom(15).center(coords);
    },

    showAll: function() {
      // Adjusts zoom/extent to show all markers
      var extent = this.markerLayer.filter(function(f){

        return f.properties.className != ' hide';
      }).extent();

      if(extent[0].lat != 'Infinity') {
        this.map.setExtent(extent);
      } else {
        this.map.center(this.model.get('coords'));
      }
      $('#content').slideUp('fast');
      
    },

    toggleError: function(message) {
      if( message === undefined) {
        $('#error').hide();
      } else {
        $('#error').show().html(message); 
      }
    },

    toggleAddingMarker: function() {
      // Set state to let map know we're adding the marker
      $('body').data('state','adding-marker');
      // Hide the "Add marker" button
      $('#basic-controls').hide();
      // Show the "Adding marker" info pane
      $('#adding-marker').show();
    },

    toggleCancelMarker: function(){
      // Set state to let map know we're adding the marker
      $('body').removeData('state');
      // Hide the "Add marker" button
      $('#basic-controls').show();
      // Show the "Adding marker" info pane
      $('#adding-marker').hide();
      this.resumeShareAutoUpdate();
    },

    toggleEditScreen: function() {
      var $editScreen = $('#edit-marker'),
          activeMarkerId = this.getMarkerIndex(this.model.get('activeMarker'));
      
      this.cancelShareAutoUpdate();
      
      if(activeMarkerId >= 0) {
        var markerProperties = this.markerLayer.features()[activeMarkerId].properties,
            $activeMarker = $('#marker-' + activeMarkerId),
            $markerColor = $editScreen.find('#marker-color'),
            $markerIcon = $editScreen.find('#marker-icon');

        $('#basic-controls').hide();
        $('#adding-marker').hide();
        $editScreen.show();
        $('#content').slideDown('fast');

        // Update features
        $markerColor.val(markerProperties['marker-color']);
        $markerIcon.val(markerProperties['marker-symbol']);
        $editScreen.find('textarea').val(markerProperties.description);

        $editScreen.find('select').change(_(function(){
          this.updateMarker();
        }).bind(this));

      } else {
        $('#basic-controls').show();
        $('#edit-marker').hide();
      }
    },

    toggleSaveMarker: function() {
      this.updateMarker();
      this.model.unset('activeMarker');
      $('#content').slideUp('fast');
      this.resumeShareAutoUpdate();
    },

    updateMarker: function() {
      var $editScreen = $('#edit-marker'),
          markers = this.markerLayer.features(),
          activeMarkerId = this.getMarkerIndex(this.model.get('activeMarker'));
      var user = this.model.get('user');
      if (user.curLocMkr !== null && this.model.get('activeMarker') === user.curLocMkr.properties.id) {
        user.curLocMkr.properties['description'] = $editScreen.find('textarea').val();
        user.curLocMkr.properties['marker-symbol'] = $editScreen.find('#marker-icon option:selected').val();
        user.curLocMkr.properties['marker-color'] = $editScreen.find('#marker-color option:selected').val();
        this.model.set('user', user);  
      } else {
        markers[activeMarkerId].properties['description'] = $editScreen.find('textarea').val();
        markers[activeMarkerId].properties['marker-symbol'] = $editScreen.find('#marker-icon option:selected').val();
        markers[activeMarkerId].properties['marker-color'] = $editScreen.find('#marker-color option:selected').val();
      }  

      // Reset all markers
      this.markerLayer.features([]);

      // Push new markers
      this.markerLayer.features(markers);
      
      this.updateCookie();
      
      if (this.model.has('share') && this.model.get('share').active) {
          this.updateShare();
      }

    }

  });

  // Start the engines
  $(init);

})(jQuery);
