
(function ($) {
    function init() {
        var model = new Backbone.Model();
        var locator = new Locator({
            model: model,
            el: $('body')
        });
    }

    var Locator = Backbone.View.extend({
        events: {
            'click #toggle-tracking': 'toggleLocation',
            'click #tracking-info': 'toggleLocation',
            'click #follow-toggle': 'followToggle',
            'click #share-location': 'shareLocation',
            'click #add-marker, .layer-add-marker': 'addMarker',
            'click .share-remove': 'removeShare',
            'click .layer-delete': 'deleteUserLayer',
            'click .layer-share': 'shareUserLayer',
            'click #add-layer': 'addUserLayerDialog',
            'click #logout-menu-item': 'logout',
            'click #open-dialog': 'openDialog',
            'click a.close': 'closeDialog',
            'click #login-button-menu': 'loginDialog',
            'click #login': 'verifyAccount',
            'click #anonymous-login': 'anonymousLogin',
            'click #register': 'registerAccount',
            'click #reset-password-submit': 'resetPassword',
            'click #create-account': 'createAccount',
            'click #mymarkers-visibility': 'toggleLayerVisiblity',
            'click #dialog-closer': 'closeDialog',
            'click #update-marker': 'newMarkerDialogSubmit',
            'click #cancel-marker': 'newMarkerDialogCancel',
            'click #update-layer': 'newLayerDialogSubmit',
            'click #cancel-layer': 'closeDialog',
            'click #open-help': 'helpDialog',
            'click #login-button-top,#open-settings': 'settingsDialog',
            'click #auto-update-shares': 'toggleAutoShareUpdate',
            'click #open-log': 'openLog',
            'click #start-simulation': 'simulateLocation'
        },
        initialize: function () {
            _(this).bindAll(
                    'winResize',
                    'toggleLocation',
                    'loadCookie',
                    'updateCookie',
                    'addPosition',
                    'getCenterWithHeading',
                    'render',
                    'radToDeg',
                    'degToRad',
                    'mod',
                    'locationUpdate',
                    'getURLParams',
                    'shareLocation',
                    'uniqID',
                    'queryServer',
                    'logout',
                    'openDialog',
                    'loginDialog',
                    'verifyAccount',
                    'registerAccount',
                    'setAuthToken',
                    'verifyLoginOnLoad',
                    'toggleLayerVisiblity',
                    'followToggle',
                    'getMyMarkers',
                    'saveMarker',
                    'addMarker',
                    'addUserLayerDialog',
                    'stopMarker',
                    'initialConfig',
                    'getUserData',
                    'createDataModel',
                    'refreshLateralMenu',
                    'deleteMarker',
                    'addDeleteMarkerListener',
                    'addCenterMarkerListener',
                    'newMarkerDialogSubmit',
                    'newLayerDialogSubmit',
                    'newMarkerDialog',
                    'helpDialog',
                    'settingsDialog',
                    'getMyMarkersLayerID',
                    'getMyLocationLayerID',
                    'shareUserLayer',
                    'updateShareAcceptance',
                    'toggleAutoShareUpdate',
                    'openLog',
                    'simulateLocation'
                    );

            this.createDataModel();
            this.initialConfig();
            // Do other initialization tasks
        },
        createDataModel: function () {
            /**************************
             * Create core data structures
             */
            var model = this.model;
            // Create user data structure
            var user = {
                name: null,
                locationData: [],
                layers: [],
                markers: [],
                track: false
            };
            model.set('user', user);

            /*
             * Shared layers (either a static or a user location layer) are 
             * specified by a ShareID. Anyone who knows the ShareID can access
             * the layer information as well as the display name of the share
             * owner
             */
            var shares = [];
            model.set('shares', shares);

            var share = {
                ShareID: null,
                time: null,
                active: false
            };
            model.set('share', share);


            /**************************
             * Create OpenLayers map
             */
            // Set initial center and zoom to contiguous United States. America! F*&# yeah!            
            var view = new ol.View({
                center: [parseFloat(-8568883.6544916), parseFloat(4695692.4860045)],
                zoom: 5
            });

            var map = new ol.Map({
                target: 'map',
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.MapQuest({layer: 'osm'}) //or 'sat', hyb'
                    })
                ],
                controls: [
                    new ol.control.ScaleLine(),
                    new ol.control.ZoomSlider()
                ],
                view: view
            });
            // add controls to map
            //map.addControl(new ol.control.ZoomSlider());
            // Create geolocation object
            var geolocation = new ol.Geolocation(/** @type {olx.GeolocationOptions} */ ({
                projection: view.getProjection(),
                trackingOptions: {
                    maximumAge: 10000,
                    enableHighAccuracy: true,
                    timeout: 600000
                }
            }));
            // Create the accuracy circle around user location
            var accuracyFeature = new ol.Feature();
            accuracyFeature.bindTo('geometry', geolocation, 'accuracyGeometry');
            // Create the user location marker
            var positionFeature = new ol.Feature();
            positionFeature.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({
                        color: '#3399CC'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 2
                    })
                })
            }));
            positionFeature.bindTo('geometry', geolocation, 'position')
                    .transform(function () {
                    }, function (coordinates) {
                        return coordinates ? new ol.geom.Point(coordinates) : null;
                    });

            var sharedPositionFeature = new ol.Feature();
            sharedPositionFeature.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({
                        color: '#FF0000'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 2
                    })
                })
            }));

            // LineString to store the different geolocation positions. This LineString
            // is time aware.
            // The Z dimension is actually used to store the rotation (heading).
            var positions = new ol.geom.LineString([],
                    /** @type {ol.geom.GeometryLayout} */ ('XYZM'));

            // Listen to position changes
            geolocation.on('change', this.locationUpdate);

            geolocation.on('error', function () {
                alert('geolocation error');
                // FIXME we should remove the coordinates in positions
            });

            // Create the user location layer
            var userLocationFeatures = new ol.source.Vector({
                features: [positionFeature, accuracyFeature]
            });
            var userLocationLayer = new ol.layer.Vector({
                source: userLocationFeatures,
                name: 'MyLocation',
                type: 'userLocation',
                LayerID: ''
            });
            map.addLayer(userLocationLayer);

            // Define marker icon style
            var markerStyle = new ol.style.Style({
                image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                    anchor: [0.5, 30],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    opacity: 0.75,
                    src: 'img/marker_red_30px.png'
                }))
            });
            model.set('markerStyle', markerStyle);

            // Define marker icon style
            var shareStyle = new ol.style.Style({
                image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                    anchor: [0.5, 30],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    opacity: 0.75,
                    src: 'img/marker_blue_30px.png'
                }))
            });
            model.set('shareStyle', shareStyle);

            // Define marker icon style
            var shareDynamicStyle = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({
                        color: '#FF0000'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 2
                    })
                })
            });
            model.set('shareDynamicStyle', shareDynamicStyle);

            // Import simulated location data
            var simulationData = JSON.parse('{"data":[{"coords":{"speed":1.7330950498580933,"accuracy":5,"altitudeAccuracy":8,"altitude":238,"longitude":5.868668798362713,"heading":67.5,"latitude":45.64444874417562},"timestamp":1394788264972},{"coords":{"speed":1.9535436630249023,"accuracy":5,"altitudeAccuracy":8,"altitude":238,"longitude":5.868715401744348,"heading":69.609375,"latitude":45.64446391542036},"timestamp":1394788266115},{"coords":{"speed":2.1882569789886475,"accuracy":10,"altitudeAccuracy":8,"altitude":238,"longitude":5.868768962105614,"heading":67.5,"latitude":45.644484995906836},"timestamp":1394788267107},{"coords":{"speed":2.4942498207092285,"accuracy":5,"altitudeAccuracy":6,"altitude":237,"longitude":5.868825791409117,"heading":68.5546875,"latitude":45.64450435810316},"timestamp":1394788267959},{"coords":{"speed":2.7581217288970947,"accuracy":5,"altitudeAccuracy":6,"altitude":237,"longitude":5.868881698703271,"heading":69.609375,"latitude":45.64452149909515},"timestamp":1394788268964},{"coords":{"speed":3.3746347427368164,"accuracy":5,"altitudeAccuracy":6,"altitude":236,"longitude":5.868938528006774,"heading":70.3125,"latitude":45.644536712249405},"timestamp":1394788270116},{"coords":{"speed":3.597411870956421,"accuracy":5,"altitudeAccuracy":6,"altitude":236,"longitude":5.868992004549009,"heading":74.8828125,"latitude":45.644547943999655},"timestamp":1394788271158},{"coords":{"speed":3.6382505893707275,"accuracy":5,"altitudeAccuracy":6,"altitude":236,"longitude":5.869038775568706,"heading":73.828125,"latitude":45.64456005584974},"timestamp":1394788271893},{"coords":{"speed":3.65671443939209,"accuracy":5,"altitudeAccuracy":6,"altitude":236,"longitude":5.869091162463528,"heading":73.4765625,"latitude":45.644572335337884},"timestamp":1394788272903},{"coords":{"speed":3.7153592109680176,"accuracy":5,"altitudeAccuracy":6,"altitude":236,"longitude":5.869144219910604,"heading":73.125,"latitude":45.64458671030182},"timestamp":1394788273914},{"coords":{"speed":3.8041043281555176,"accuracy":5,"altitudeAccuracy":4,"altitude":236,"longitude":5.869205072527629,"heading":72.421875,"latitude":45.64460313883204},"timestamp":1394788274901},{"coords":{"speed":3.9588162899017334,"accuracy":5,"altitudeAccuracy":4,"altitude":236,"longitude":5.869268858810765,"heading":72.421875,"latitude":45.64461990263838},"timestamp":1394788276140},{"coords":{"speed":4.152309417724609,"accuracy":5,"altitudeAccuracy":4,"altitude":235,"longitude":5.869351252918941,"heading":78.046875,"latitude":45.64466122542102},"timestamp":1394788276948},{"coords":{"speed":4.49971866607666,"accuracy":5,"altitudeAccuracy":6,"altitude":236,"longitude":5.869433479389054,"heading":79.8046875,"latitude":45.64467040360499},"timestamp":1394788277892},{"coords":{"speed":4.824056148529053,"accuracy":5,"altitudeAccuracy":6,"altitude":235,"longitude":5.869504055013758,"heading":91.40625,"latitude":45.64466089014489},"timestamp":1394788279211},{"coords":{"speed":5.269814491271973,"accuracy":10,"altitudeAccuracy":6,"altitude":235,"longitude":5.869575049733621,"heading":91.40625,"latitude":45.64465967476893},"timestamp":1394788279898},{"coords":{"speed":5.4861016273498535,"accuracy":5,"altitudeAccuracy":6,"altitude":235,"longitude":5.86963213049422,"heading":95.2734375,"latitude":45.64465091568012},"timestamp":1394788280935},{"coords":{"speed":5.380503177642822,"accuracy":5,"altitudeAccuracy":6,"altitude":235,"longitude":5.869714859878523,"heading":75.5859375,"latitude":45.64468792178262},"timestamp":1394788281930},{"coords":{"speed":5.276519775390625,"accuracy":5,"altitudeAccuracy":6,"altitude":234,"longitude":5.869746124377353,"heading":55.1953125,"latitude":45.64467706721801},"timestamp":1394788282909},{"coords":{"speed":5.212399482727051,"accuracy":5,"altitudeAccuracy":6,"altitude":232,"longitude":5.8697939850444625,"heading":49.5703125,"latitude":45.64467899505574},"timestamp":1394788284221},{"coords":{"speed":5.174651622772217,"accuracy":5,"altitudeAccuracy":6,"altitude":232,"longitude":5.869789123540623,"heading":18.984375,"latitude":45.64469378911484},"timestamp":1394788284924},{"coords":{"speed":5.211904525756836,"accuracy":5,"altitudeAccuracy":4,"altitude":232,"longitude":5.869806222623093,"heading":10.1953125,"latitude":45.64473896757294},"timestamp":1394788286251},{"coords":{"speed":5.254780292510986,"accuracy":5,"altitudeAccuracy":4,"altitude":233,"longitude":5.86982952431391,"heading":18.6328125,"latitude":45.64478381075491},"timestamp":1394788286927},{"coords":{"speed":5.329030513763428,"accuracy":5,"altitudeAccuracy":4,"altitude":232,"longitude":5.869875792419417,"heading":33.75,"latitude":45.644830078860416},"timestamp":1394788288221},{"coords":{"speed":5.384955883026123,"accuracy":5,"altitudeAccuracy":4,"altitude":232,"longitude":5.869927508761985,"heading":46.7578125,"latitude":45.64486025371183},"timestamp":1394788288935},{"coords":{"speed":5.309582233428955,"accuracy":5,"altitudeAccuracy":4,"altitude":232,"longitude":5.869972854858143,"heading":47.109375,"latitude":45.644890596201314},"timestamp":1394788290178},{"coords":{"speed":5.250724792480469,"accuracy":5,"altitudeAccuracy":6,"altitude":231,"longitude":5.870029265066488,"heading":46.40625,"latitude":45.644932673355235},"timestamp":1394788290890},{"coords":{"speed":5.3057990074157715,"accuracy":5,"altitudeAccuracy":6,"altitude":231,"longitude":5.870077712466819,"heading":39.375,"latitude":45.644970224281444},"timestamp":1394788291884},{"coords":{"speed":5.431822299957275,"accuracy":5,"altitudeAccuracy":6,"altitude":231,"longitude":5.870133116846783,"heading":43.59375,"latitude":45.6450097449549},"timestamp":1394788292885},{"coords":{"speed":5.542125225067139,"accuracy":5,"altitudeAccuracy":6,"altitude":231,"longitude":5.870186509569986,"heading":43.59375,"latitude":45.645047421609654},"timestamp":1394788294100},{"coords":{"speed":5.647174835205078,"accuracy":5,"altitudeAccuracy":6,"altitude":231,"longitude":5.870246104901535,"heading":42.890625,"latitude":45.645093647805645},"timestamp":1394788295157},{"coords":{"speed":5.735793590545654,"accuracy":5,"altitudeAccuracy":6,"altitude":230,"longitude":5.870298156520231,"heading":42.5390625,"latitude":45.64514368776758},"timestamp":1394788296124},{"coords":{"speed":5.809989929199219,"accuracy":5,"altitudeAccuracy":6,"altitude":230,"longitude":5.870346436282499,"heading":43.59375,"latitude":45.64519154843469},"timestamp":1394788296960},{"coords":{"speed":5.877871036529541,"accuracy":5,"altitudeAccuracy":6,"altitude":228,"longitude":5.87034755932109,"heading":42.75193405151367,"latitude":45.645270362475216},"timestamp":1394788298177},{"coords":{"speed":5.937166690826416,"accuracy":5,"altitudeAccuracy":6,"altitude":228,"longitude":5.870402806867787,"heading":42.75193405151367,"latitude":45.645312142096095},"timestamp":1394788298898},{"coords":{"speed":6.071393966674805,"accuracy":5,"altitudeAccuracy":6,"altitude":229,"longitude":5.870464520921814,"heading":43.183074951171875,"latitude":45.64535851937182},"timestamp":1394788299897},{"coords":{"speed":6.329115390777588,"accuracy":5,"altitudeAccuracy":6,"altitude":230,"longitude":5.8705368384107715,"heading":43.183074951171875,"latitude":45.645412389093565},"timestamp":1394788300957},{"coords":{"speed":6.581554889678955,"accuracy":5,"altitudeAccuracy":6,"altitude":229,"longitude":5.870600162706978,"heading":43.183074951171875,"latitude":45.64545955929912},"timestamp":1394788302211},{"coords":{"speed":6.605470180511475,"accuracy":5,"altitudeAccuracy":6,"altitude":230,"longitude":5.870657211053185,"heading":43.183074951171875,"latitude":45.64550205482465},"timestamp":1394788302917},{"coords":{"speed":6.623170375823975,"accuracy":5,"altitudeAccuracy":4,"altitude":229,"longitude":5.870713613403495,"heading":43.183074951171875,"latitude":45.64554406917767},"timestamp":1394788303929},{"coords":{"speed":6.645580768585205,"accuracy":5,"altitudeAccuracy":4,"altitude":229,"longitude":5.870773011629353,"heading":43.183074951171875,"latitude":45.64558831489415},"timestamp":1394788304902},{"coords":{"speed":6.663600444793701,"accuracy":5,"altitudeAccuracy":4,"altitude":229,"longitude":5.87083890910435,"heading":43.183074951171875,"latitude":45.645637401898654},"timestamp":1394788306035},{"coords":{"speed":6.664675712585449,"accuracy":5,"altitudeAccuracy":6,"altitude":229,"longitude":5.870890033475007,"heading":43.183074951171875,"latitude":45.64567548463474},"timestamp":1394788307080},{"coords":{"speed":6.6489081382751465,"accuracy":5,"altitudeAccuracy":6,"altitude":228,"longitude":5.870943189474929,"heading":43.183074951171875,"latitude":45.645715080460064},"timestamp":1394788308211},{"coords":{"speed":6.551820755004883,"accuracy":5,"altitudeAccuracy":6,"altitude":228,"longitude":5.871005613698799,"heading":43.183074951171875,"latitude":45.64576158014743},"timestamp":1394788308904},{"coords":{"speed":6.467689514160156,"accuracy":5,"altitudeAccuracy":6,"altitude":229,"longitude":5.871058030061249,"heading":43.183074951171875,"latitude":45.64580062501799},"timestamp":1394788310161},{"coords":{"speed":6.3997955322265625,"accuracy":5,"altitudeAccuracy":6,"altitude":229,"longitude":5.871062579208228,"heading":43.183074951171875,"latitude":45.64580401381376},"timestamp":1394788310957},{"coords":{"speed":5.799798488616943,"accuracy":5,"altitudeAccuracy":6,"altitude":230,"longitude":5.8710817079554545,"heading":43.183074951171875,"latitude":45.64581826277647},"timestamp":1394788312036},{"coords":{"speed":4.424941062927246,"accuracy":5,"altitudeAccuracy":6,"altitude":230,"longitude":5.871121835629857,"heading":175.4296875,"latitude":45.645828271551544},"timestamp":1394788312951},{"coords":{"speed":4.3496222496032715,"accuracy":5,"altitudeAccuracy":6,"altitude":231,"longitude":5.8710026017471595,"heading":176.484375,"latitude":45.645752236602775},"timestamp":1394788315227},{"coords":{"speed":5.076380252838135,"accuracy":5,"altitudeAccuracy":6,"altitude":232,"longitude":5.871189236646398,"heading":176.1328125,"latitude":45.64553692475487},"timestamp":1394788316970},{"coords":{"speed":5.102786064147949,"accuracy":5,"altitudeAccuracy":6,"altitude":231,"longitude":5.871200384577616,"heading":171.2109375,"latitude":45.64548554368843},"timestamp":1394788317965},{"coords":{"speed":4.705626964569092,"accuracy":5,"altitudeAccuracy":6,"altitude":231,"longitude":5.871210945775612,"heading":164.1796875,"latitude":45.645453105723156},"timestamp":1394788318956},{"coords":{"speed":4.378190040588379,"accuracy":5,"altitudeAccuracy":6,"altitude":231,"longitude":5.87124749087344,"heading":126.2109375,"latitude":45.645433282522156},"timestamp":1394788320197},{"coords":{"speed":4.208680152893066,"accuracy":5,"altitudeAccuracy":6,"altitude":233,"longitude":5.871283365419014,"heading":125.859375,"latitude":45.6454103999265},"timestamp":1394788320894},{"coords":{"speed":4.072604179382324,"accuracy":5,"altitudeAccuracy":6,"altitude":233,"longitude":5.871314043184622,"heading":103.359375,"latitude":45.645410819021656},"timestamp":1394788322169},{"coords":{"speed":3.7680623531341553,"accuracy":5,"altitudeAccuracy":6,"altitude":234,"longitude":5.871355114510163,"heading":92.4609375,"latitude":45.645418111277415},"timestamp":1394788322898},{"coords":{"speed":3.537794351577759,"accuracy":10,"altitudeAccuracy":6,"altitude":234,"longitude":5.871393922721847,"heading":92.4609375,"latitude":45.64541693781097},"timestamp":1394788323968},{"coords":{"speed":3.3741507530212402,"accuracy":10,"altitudeAccuracy":6,"altitude":234,"longitude":5.8714455552453835,"heading":75.5859375,"latitude":45.645444011358215},"timestamp":1394788324896},{"coords":{"speed":3.3729660511016846,"accuracy":10,"altitudeAccuracy":6,"altitude":235,"longitude":5.87150791660498,"heading":70.3125,"latitude":45.64547209073384},"timestamp":1394788325971},{"coords":{"speed":3.463883876800537,"accuracy":10,"altitudeAccuracy":6,"altitude":235,"longitude":5.871554352348551,"heading":70.3125,"latitude":45.64548374157925},"timestamp":1394788327122},{"coords":{"speed":3.5247886180877686,"accuracy":10,"altitudeAccuracy":6,"altitude":235,"longitude":5.871567260479435,"heading":67.1484375,"latitude":45.645496733529164},"timestamp":1394788328164},{"coords":{"speed":3.455146551132202,"accuracy":10,"altitudeAccuracy":6,"altitude":235,"longitude":5.871608583262071,"heading":68.90625,"latitude":45.64550293613751},"timestamp":1394788328985},{"coords":{"speed":3.382997989654541,"accuracy":10,"altitudeAccuracy":8,"altitude":236,"longitude":5.871640518313154,"heading":78.75,"latitude":45.6454965658911},"timestamp":1394788329900},{"coords":{"speed":3.242330312728882,"accuracy":10,"altitudeAccuracy":8,"altitude":236,"longitude":5.871667759498462,"heading":92.4609375,"latitude":45.64548562750746},"timestamp":1394788331120},{"coords":{"speed":3.074465274810791,"accuracy":10,"altitudeAccuracy":8,"altitude":236,"longitude":5.871691312646374,"heading":110.0390625,"latitude":45.645468402696444},"timestamp":1394788332219}]}');
            window.console.log('simulationData: ' + JSON.stringify(simulationData.data));
            model.set('simulationData', simulationData.data);
            model.set('simulatingLocation', false);

            //Save objects to model
            model.set('view', view);
            model.set('map', map);
            model.set('geolocation', geolocation);
            model.set('positions', positions);
            model.set('sharedPositionFeature', sharedPositionFeature);
            model.set('initialZoom', true);
            model.set('initialShareZoom', true);
            model.set('initialCenter', true);
            model.set('follow', true);
            model.set('followShared', true);
            model.set('initialShareCenter', true);
            model.set('previousM', 0);
            model.set('deltaMean', 10000);  // the geolocation sampling period mean in ms
            model.set('updateInterval', 10); // seconds
            model.set('sharesUpdateInterval', 15); // seconds
            model.set('lastLocUpload', (new Date()).getTime());
            model.set('autoUpdateShareState', true);
        },
        /*
         * Reset layers menu to the minimum default state
         * @returns {undefined}
         */
        resetUserLayersMenu: function () {
            var layerMenu = $('#layer-menu').children('ul');
            var label = 'Enable auto-update';
            if (this.model.get('autoUpdateShareState')) {
                label = 'Disable auto-update';
            }
            $(layerMenu).html('');
            layerMenu.append('\n\
                <li><a href="#" id="add-layer">Add layer...</a></li> \n\
                ');
            $('#shares-menu').children('ul').html('');
            $('#shares-menu').children('ul').append('\n\
                <li><a href="#" id="auto-update-shares">' + label + '</a></li> \n\
                ');
        },
        /*
         *  Add layer to menu. DOM element ID is LayerID, the link text is the 
         *  layer description. 
         *  TODO: New classes layer-visibility, layer-share, layer-add-marker 
         *  should be added to the event triggers to launch the correct action
         *  for the layer
         * @param {type} LayerID
         * @returns {undefined}
         */
        addLayerToMenu: function (LayerID) {
            var user = this.model.get('user');
            var userLayers = user.layers;
            for (var i = 0; i < userLayers.length; i++) {
                var userLayer = userLayers[i];
                if (userLayer.LayerID === LayerID) {
                    var shareLinkLabel = 'Share';
                    if (userLayer.ShareID !== null) {
                        shareLinkLabel = 'Stop sharing';// userLayer.ShareID;
                    }
                    var layerMenu = $('#layer-menu').children('ul');
                    layerMenu.append('\n\
                        <li class="item-has-children" id="' + LayerID + '"> \n\
                            <a href="#">' + userLayer.Description + '</a> \n\
                            <ul class="sub-menu"> \n\
                                <li><a href="#" class="control-button layer-visibility">Hide</a></li> \n\
                                <li><a href="#" class="control-button layer-share" id="share-layer-' + LayerID + '">' + shareLinkLabel + '</a></li> \n\
                                <li><a href="#" class="control-button layer-delete" id="delete-layer-' + LayerID + '">Delete</a></li> \n\
                                <li><a href="#" class="control-button layer-add-marker" id="add-marker-' + LayerID + '">Add marker...</a></li> \n\
                            </ul> \n\
                        </li> <!-- item-has-children --> \n\
                        ');
                    //this.addShareLayerListener(LayerID);
                    //this.addHideLayerListener(LayerID);
                    var markerMenu = $('#' + LayerID).children('ul');
                    var layerMarkers = user.markers;
                    for (var j = 0; j < layerMarkers.length; j++) {
                        var markerLayer = layerMarkers[j];
                        for (var k = 0; k < markerLayer.length; k++) {
                            var marker = markerLayer[k];
                            if (marker.LayerID === LayerID) {
                                var markerDesc = marker.MarkerID;
                                if (marker.Description !== '') {
                                    markerDesc = marker.Description;
                                }
                                markerMenu.append('\n\
                                    <li class="item-has-children" id="' + marker.MarkerID + '"> \n\
                                        <a href="#0" >' + markerDesc + '</a> \n\
                                        <ul class="sub-menu"> \n\
                                            <li><a href="#0" class="center-marker">Center</a></li> \n\
                                            <li><a href="#0" class="delete-marker">Delete...</a></li> \n\
                                        </ul> \n\
                                    </li> <!-- item-has-children -->  \n\
                                    ');
                                this.addDeleteMarkerListener(marker.MarkerID);
                                this.addCenterMarkerListener(marker.MarkerID);
                            } else {
                                break; // try the next marker layer
                            }
                        }
                    }
                    this.refreshLateralMenu();
                    return;
                }
            }
        },
        /*
         * Erase and re-generate the menu controls for the current layers and markers
         * @returns {undefined}
         */
        updateMenuLayers: function () {
            /*
             * 1) Set menu to default state
             * 2) Build user layers menu
             * 3) Build shared layers menu
             */
            this.resetUserLayersMenu();
            var user = this.model.get('user');
            var userLayers = user.layers;
            var layerMarkers = user.markers;
            var myLocationLayerID = this.getMyLocationLayerID();
            for (var i = 0; i < userLayers.length; i++) {
                var userLayer = userLayers[i];
                if (userLayer.LayerID !== myLocationLayerID) {
                    this.addLayerToMenu(userLayer.LayerID);
                }
            }
            var shares = this.model.get('shares');
            for (var i = 0; i < shares.length; i++) {
                if (parseInt(shares[i].Accepted) === 1) {
                    this.addSharedLayerToMenu(shares[i]);
                }
            }
        },
        addSharedLayerToMenu: function (sharedLayerInfo) {
            var ShareID = sharedLayerInfo.ShareID;
            var ShareDescription = sharedLayerInfo.Description;
            var sharesMenu = $('#shares-menu').children('ul');
            sharesMenu.append('\n\
                        <li class="item-has-children" id="' + ShareID + '"> \n\
                            <a href="#">' + ShareDescription + '</a> \n\
                            <ul class="sub-menu"> \n\
                                <li><a href="#" class="control-button share-visibility" id="hide-share-' + ShareID + '">Hide</a></li> \n\
                                <li><a href="#" class="control-button share-remove" id="remove-share-' + ShareID + '">Remove</a></li> \n\
                            </ul> \n\
                        </li> <!-- item-has-children --> \n\
                        ');
            var markerMenu = $('#' + ShareID).children('ul');
            var shareMarkers = sharedLayerInfo.markers;

            for (var k = 0; k < shareMarkers.length; k++) {
                var marker = shareMarkers[k];
                var markerDesc = marker.MarkerID;
                if (marker.Description !== '') {
                    markerDesc = marker.Description;
                }
                markerMenu.append('\n\
                                    <li class="item-has-children" id="' + marker.MarkerID + '"> \n\
                                        <a href="#0" >' + markerDesc + '</a> \n\
                                        <ul class="sub-menu"> \n\
                                            <li><a href="#0" class="center-marker">Center</a></li> \n\
                                            <li><a href="#0" class="delete-marker">Delete...</a></li> \n\
                                        </ul> \n\
                                    </li> <!-- item-has-children -->  \n\
                                    ');
                this.addDeleteMarkerListener(marker.MarkerID);
                this.addCenterMarkerListener(marker.MarkerID);
            }
            this.refreshLateralMenu();
            return;
        },
        /*
         * Erase and re-generate all OpenLayers map layers and features from the
         * user data
         * @returns {undefined}
         */
        updateMapLayers: function () {
            var map = this.model.get('map');
            var user = this.model.get('user');
            var userLayers = user.layers;
            var layerMarkers = user.markers;
            var myLocationLayerID = this.getMyLocationLayerID();
            // Remove all map layers except user location 
            var currentMapLayers = map.getLayers().getArray();
            for (var i = 1; i < currentMapLayers.length; i++) {
                var layer = currentMapLayers[i];
                // If the user location layer has not been initialized with the correct LayerID
                if (layer.get('LayerID') === '' && layer.get('name') === 'MyLocation') {
                    layer.set('LayerID', myLocationLayerID);
                }
                if (layer.get('LayerID') !== myLocationLayerID && typeof (layer.get('LayerID')) !== 'undefined') {
                    map.removeLayer(layer);
                    window.console.log('removed layer: ' + JSON.stringify(layer.get('LayerID')));
                }
            }
            // Generate all other user map layers from current data            
            for (var i = 0; i < userLayers.length; i++) {
                var userLayer = userLayers[i];
                if (userLayer.LayerID !== myLocationLayerID) {
                    var newLayerFeatures = [];
                    for (var j = 0; j < layerMarkers.length; j++) {
                        var markerLayer = layerMarkers[j];
                        for (var k = 0; k < markerLayer.length; k++) {
                            var marker = markerLayer[k];
                            //window.console.log('marker: ' + JSON.stringify(marker));
                            if (marker.LayerID === userLayer.LayerID) {
                                //alert('adding marker: '+JSON.stringify(marker.MarkerID));
                                var newMapMarker = new ol.Feature({
                                    geometry: new ol.geom.Point([marker.Lat, marker.Lon]),
                                    name: marker.Description
                                });
                                newMapMarker.setStyle(this.model.get('markerStyle'));
                                newMapMarker.setId(marker.MarkerID);
                                newLayerFeatures.push(newMapMarker);
                            } else {
                                break; // try the next marker layer
                            }
                        }
                    }

                    var newLayerSource = new ol.source.Vector({
                        features: newLayerFeatures
                    });
                    var newLayer = new ol.layer.Vector({
                        source: newLayerSource,
                        name: userLayer.Description,
                        type: userLayer.Type,
                        LayerID: userLayer.LayerID
                    });
                    map.addLayer(newLayer);
                }
            }
            // Add the shared layers to the map
            var shares = this.model.get('shares');
            for (var i = 0; i < shares.length; i++) {
                var share = shares[i];
                if (parseInt(share.Accepted) === 1) {
                    var newLayerFeatures = [];
                    for (var j = 0; j < share.markers.length; j++) {
                        var marker = share.markers[j];
                        var newMapMarker = new ol.Feature({
                            geometry: new ol.geom.Point([marker.Lat, marker.Lon]),
                            name: marker.Description
                        });
                        if (marker.Type === 'Dynamic') {
                            newMapMarker.setStyle(this.model.get('shareDynamicStyle'));
                            var view = this.model.get('view');
                            var handle = this;
                            if (handle.model.get('initialShareCenter')) {
                                view.setCenter([parseFloat(marker.Lat), parseFloat(marker.Lon)]);
                                handle.model.set('initialShareCenter', false);
                            }
                            if (handle.model.get('initialShareZoom') === true) {
                                view.setZoom(16);
                                handle.model.set('initialShareZoom', false);
                            } else {
                                //view.setZoom(view.getZoom());
                            }
                        } else {
                            newMapMarker.setStyle(this.model.get('shareStyle'));
                        }
                        newMapMarker.setId(marker.MarkerID);
                        newLayerFeatures.push(newMapMarker);
                    }

                    var newLayerSource = new ol.source.Vector({
                        features: newLayerFeatures
                    });
                    var newLayer = new ol.layer.Vector({
                        source: newLayerSource,
                        name: share.Description,
                        type: 'share',
                        LayerID: share.ShareID
                    });
                    map.addLayer(newLayer);
                    window.console.log('adding layer to map: ' + JSON.stringify(newLayer.get('name')));
                }
            }
            this.model.set('map', map);
        },
        /* 
         * Configure the initial view and load the user data
         * @returns {undefined}
         */
        initialConfig: function () {

            // Set map size based on current viewport size
            $(window).on("resize", this.winResize);
            this.winResize();

            // Configure displayed controls            
            $('#logout-menu-item').hide();
            $('#layer-menu').hide();

            // Load previously saved model data
            this.loadCookie();
            this.verifyLoginOnLoad();
        },
        /*
         * Loads the data saved in the cookie.
         * TODO: Does anything need to be saved other than the authtoken? User 
         * preferences should even be saved in the database.
         * @returns {Boolean}
         */
        loadCookie: function () {
            var cookieData = docCookies.getItem("oMCookie");

            if (cookieData !== null) {
                var cookieData = JSON.parse(cookieData);
                //window.console.log('cookieData: ' + JSON.stringify(cookieData));
                this.model.set('cookieData', cookieData);
                if (cookieData.hasOwnProperty('share')) {
                    var share = cookieData.share;
                    this.model.set('share', share);
                    if (share.active) {
                        this.shareLocation();
                    }
                }

                if (cookieData.hasOwnProperty('authtoken')) {
                    var authtoken = cookieData.authtoken;
                    this.model.set('authtoken', authtoken);
                }
                return true;
            } else {
                return false;
            }

        },
        /*
         * Save local data structures to a cookie so the user does not have to 
         * log in every time
         * @returns {undefined}
         */
        updateCookie: function () {
            var cookieData = {
                share: this.model.get('share'),
                authtoken: this.model.get('authtoken')
            };
            docCookies.setItem("oMCookie", JSON.stringify(cookieData), Infinity);
        },
        /**
         * When the geolocation information is updated, this function saves the 
         * data and updates the interface
         */
        locationUpdate: function (evt) {
            var handle = this;
            var positions = this.model.get('positions');
            var geolocation = this.model.get('geolocation');
            var deltaMean = this.model.get('deltaMean');
            var view = this.model.get('view');

            var position = geolocation.getPosition();
            var accuracy = geolocation.getAccuracy();
            var heading = geolocation.getHeading() || 0;
            var speed = geolocation.getSpeed() || 0;
            var m = Date.now();

            this.addPosition(position, heading, m, speed);

            var coords = positions.getCoordinates();
            var len = coords.length;
            if (len >= 2) {
                deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
            }
            var html = [
                'Position: ' + position[0].toFixed(2) + ', ' + position[1].toFixed(2),
                'Accuracy: ' + accuracy,
                'Heading: ' + Math.round(this.radToDeg(heading)) + '&deg;',
                'Speed: ' + (speed * 3.6).toFixed(1) + ' km/h',
                'Delta: ' + Math.round(deltaMean) + 'ms'
            ].join('<br />');
            document.getElementById('info').innerHTML = html;
            handle.model.set('coords', position);

            if (this.model.get('initialCenter') || this.model.get('follow')) {
                view.setCenter(position);
                this.model.set('initialCenter', false);
            }
            if (this.model.get('initialZoom') === true) {
                view.setZoom(16);
                this.model.set('initialZoom', false);
            }
            var locData = {
                lat: position[0].toFixed(2),
                lon: position[1].toFixed(2),
                accuracy: accuracy,
                updateTime: (new Date()).getTime()
            };
            var user = handle.model.get('user');
            user.locationData.push(locData);
            if (user.locationData.length > 10) {
                user.locationData.shift(); // Only keep the 10 most recent locations
            }
            console.log('updated location: ' + JSON.stringify(user));
            handle.model.set('user', user);
            //Only sending location data to server if explicitly sharing
            handle.log('location update (' + locData.lat + ',' + locData.lon + ')');
            if (handle.model.get('share').active && (locData.updateTime - handle.model.get('lastLocUpload')) > 1000 * handle.model.get('updateInterval')) {
                console.log('updateTime: ' + locData.updateTime + ', lastLocUpload: ' + handle.model.get('lastLocUpload'));
                $('#info').append('<br />Sending update...');
                handle.log('UPLOADING (' + locData.lat + ',' + locData.lon + ')');
                handle.model.set('lastLocUpload', (new Date()).getTime());
                handle.log('lastLocUpload: ' + handle.model.get('lastLocUpload'));
                handle.updateShare();
            }
            handle.updateCookie();
        },
        /*
         * This turns the geolocation tracking on and off.
         * TODO: Clean-up the functionality, like the fact that the tracking
         * state is saved in the cookie.
         * @returns {undefined}
         */
        toggleLocation: function () {
            var model = this.model;
            var geolocation = model.get('geolocation');
            var map = model.get('map');
            var user = this.model.get('user');
            if (!user.track) {
                $("#tracking-info").css('display', 'block');
                $("#toggle-tracking").html('Tracking...');
                if (!this.model.get('simulatingLocation')) {
                    geolocation.setTracking(true); // Start position tracking
                }
                map.on('postcompose', this.render);
                map.render();
                user.track = true;
            } else {
                $("#tracking-info").css('display', 'none');
                $("#toggle-tracking").html('Track Location');
                geolocation.setTracking(false); // Start position tracking
                map.un('postcompose', this.render);
                user.track = false;
            }
            this.model.set('user', user);
            this.updateCookie();

        },
        // postcompose callback
        render: function () {
            var map = this.model.get('map');
            //window.console.log('Render map!');
            map.render();
        },
        addPosition: function (position, heading, m, speed) {
            var model = this.model;
            var positions = model.get('positions');
            var x = position[0];
            var y = position[1];
            var fCoords = positions.getCoordinates();
            var previous = fCoords[fCoords.length - 1];
            var prevHeading = previous && previous[2];
            if (prevHeading) {
                var headingDiff = heading - this.mod(prevHeading);

                // force the rotation change to be less than 180°
                if (Math.abs(headingDiff) > Math.PI) {
                    var sign = (headingDiff >= 0) ? 1 : -1;
                    headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
                }
                heading = prevHeading + headingDiff;
            }
            positions.appendCoordinate([x, y, heading, m]);

            // only keep the 20 last coordinates
            positions.setCoordinates(positions.getCoordinates().slice(-20));

            model.set('positions', positions);
        },
        /**
         * Resizes the map to fit the current viewport size
         */
        winResize: function () {

            var viewportWidth = $(window).width();
            var viewportHeight = $(window).height();
            $("div.map").css('height', viewportHeight);
            $("div.map").css('width', viewportWidth);
            this.model.get('map').updateSize();
        },
        /**
         * recenters the view by putting the given coordinates at 3/4 from the 
         * top of the screen
         */
        getCenterWithHeading: function (position, rotation, resolution) {
            var map = this.model.get('map');
            var view = this.model.get('view');
            var size = map.getSize();
            var height = size[1];

            if (this.model.get('initialZoom') === true) {
                view.setZoom(16);
                this.model.set('initialZoom', false);
            } else if (this.model.get('initialShareZoom') === true) {
                view.setZoom(16);
                this.model.set('initialShareZoom', false);
            }

            return [
                position[0] - Math.sin(rotation) * height * resolution * 1 / 4,
                position[1] + Math.cos(rotation) * height * resolution * 1 / 4
            ];
        },
        // convert radians to degrees
        radToDeg: function (rad) {
            return rad * 360 / (Math.PI * 2);
        },
        // convert degrees to radians
        degToRad: function (deg) {
            return deg * Math.PI * 2 / 360;
        },
        // modulo for negative values
        mod: function (n) {
            return ((n % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        },
        /**
         *	Communicate with server
         */
        queryServer: function (dataToSend, phpFilename, callback) {
            //var phpFilename = 'php/backend.php';
            var params = "data=" + JSON.stringify(dataToSend);
            var http = new XMLHttpRequest();
            var phpfolder = 'php/';
            var url = phpfolder + phpFilename;
            http.open("POST", url, true);
            http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            http.onreadystatechange = function () {
                if (http.readyState === 4 && http.status === 200) {
                    callback(http.responseText);
                }
            };
            http.send(params);
        },
        queryServerSynchronous: function (dataToSend, phpFilename, callback) {
            //var phpFilename = 'php/backend.php';
            var params = "data=" + JSON.stringify(dataToSend);
            var http = new XMLHttpRequest();
            var phpfolder = 'php/';
            var url = phpfolder + phpFilename;
            http.open("POST", url, false);
            http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            http.onreadystatechange = function () {
                if (http.readyState === 4 && http.status === 200) {
                    callback(http.responseText);
                }
            };
            http.send(params);
        },
        /**
         *	Generate unique identifier string for user ID
         */
        uniqID: function (prefix) {
            var chars = "0123456789ABCDEFGHIJKLMNOPQURSTUVWXYZ012345678901234567890123456789";
            if (typeof (prefix) === 'undefined')
                prefix = '';
            var size = 10;
            var str = "";
            for (var i = 0; i < size; i++)
            {
                var randomChar = chars.substr(Math.floor(Math.random() * chars.length), 1);
                str += randomChar;
            }
            return prefix + str;
        },
        getURL: function () {
            var url = document.location.href;
            var rootURL = url.substring(0, url.lastIndexOf("/"));
            return rootURL;
        },
        shareLocation: function () {
            var shareData = this.model.get('share');
            if (!shareData.active) {
                if (shareData.ShareID !== null) {
                    var ShareID = shareData.ShareID;
                } else {
                    var ShareID = this.uniqID();
                }
                var addShareData = {
                    authtoken: this.model.get('authtoken'),
                    ShareID: ShareID,
                    time: (new Date()).getTime(),
                    active: true
                };
                // FIXME: Take out authtoken
                this.model.set('share', addShareData);
                this.queryServer(addShareData, 'createShare.php', function (response) {
                    var result = JSON.parse(response);
                    if (result.status) {
                        window.console.log('Share created!');
                    } else {
                        window.console.log('Share creation failed.');
                    }
                });
                $('#share-location').html('Stop Sharing');
                $('#share-info').slideDown('fast');
                window.console.log('shareID mailto: ' + this.model.get('share').ShareID);
                
                $('#share-url').prop("href", "mailto:?subject=ownMapp%20Link%20&body=" + this.getURL() + '/map.php?ShareID=' + this.model.get('share').ShareID); // + "%26autoupdate=60");
                this.updateCookie();

            } else {
                $('#share-info').slideUp('fast');
                $('#share-location').html('Start Sharing');
                var shareData = this.model.get('share');
                shareData.active = false;
                this.model.set('share', shareData);
                this.updateCookie();

            }

        },
        getSharedUserLocation: function () {
            var sharedMap = this.model.get('sharedMap');
            var data = {
                authtoken: this.model.get('authtoken'),
                ShareID: sharedMap.ShareID
            };
            var handle = this;
            this.queryServer(data, 'getSharedUserLocation.php', function (response) {
                window.console.log(response);
                var result = JSON.parse(response);
                if (result.status) {
                    var sharedMap = handle.model.get('sharedMap');
                    var coords = [result.Lat, result.Lon];
                    sharedMap.coords = coords;
                    handle.model.set('sharedMap', sharedMap);
                    var sharedPositionFeature = handle.model.get('sharedPositionFeature');
                    sharedPositionFeature.setGeometry(new ol.geom.Point(sharedMap.coords));
                    var view = handle.model.get('view');
                    // this.getCenterWithHeading(sharedMap.coords,view.heading,view.resolution);

                    if (handle.model.get('initialShareCenter') || handle.model.get('followShared')) {
                        view.setCenter([parseFloat(sharedMap.coords[0]), parseFloat(sharedMap.coords[1])]);
                        handle.model.set('initialShareCenter', false);
                    }
                    if (handle.model.get('initialShareZoom') === true) {
                        view.setZoom(16);
                        handle.model.set('initialShareZoom', false);
                    } else {
                        //view.setZoom(view.getZoom());
                    }
                    window.console.log('updated share: ' + JSON.stringify(sharedMap.coords));
                    handle.model.set('sharedPositionFeature', sharedPositionFeature);

                    //handle.render();
                } else {
                    window.console.log('Error getting shared location');
                }
            });
        },
        getURLParams: function () {
            var qsParm = new Array();
            var query = window.location.search.substring(1);
            var parms = query.split('&');
            for (var i = 0; i < parms.length; i++) {
                var pos = parms[i].indexOf('=');
                if (pos > 0) {
                    var key = parms[i].substring(0, pos);
                    var val = parms[i].substring(pos + 1);
                    qsParm[key] = val;
                }
            }
            return qsParm;
        },
        updateShare: function () {
            var locData = this.model.get('user').locationData.pop();
            var lat = locData.lat;
            var lon = locData.lon;
            var updateShareData = {
                authtoken: this.model.get('authtoken'),
                ShareID: this.model.get('share').ShareID,
                coords: [lat, lon],
                time: (new Date()).getTime()
            };
            //window.console.log('shareID: ' + this.model.get('share').ShareID);
            this.queryServer(updateShareData, 'updateShare.php', function (response) {
            });
        },
        /*
         * New layer dialog is opened.
         * TODO: The form should submit properly when the ENTER key is pressed.
         * @returns {undefined}
         */
        addUserLayerDialog: function () {
            $('#cd-menu-trigger').click(); // Close menu
            this.closeDialog();
            this.openDialog();
            $('#new-layer-dialog').show();
        },
        /*
         * Create new layer based on the name entered by the user in the new layer dialog
         * TODO: The form should 
         * @returns {undefined}
         */
        newLayerDialogSubmit: function () {
            this.model.set('newLayerDescription', $('#new-layer-description').val());
            this.closeDialog();
            this.createLayer();
        },
        removeShare: function (event) {
            var answer = confirm("Remove share?");
            if (!answer) {
                return;
            }
            var ShareID = event.target.id;
            ShareID = ShareID.substr(13); // extract the ShareID from the DOM element ID
            var data = {
                authtoken: this.model.get('authtoken'),
                ShareID: ShareID
            };
            var handle = this;
            this.queryServer(data, 'removeShare.php', function (response) {
                var result = JSON.parse(response);
                if (result.status) {
                    handle.getUserData();
                } else {
                    window.console.log('Failed to remove share.');
                }
            });
        },
        deleteUserLayer: function (event) {
            var answer = confirm("Delete layer?");
            if (!answer) {
                return;
            }
            var LayerID = event.target.id;
            LayerID = LayerID.substr(13); // extract the LayerID from the DOM element ID
            var data = {
                authtoken: this.model.get('authtoken'),
                LayerID: LayerID
            };
            var handle = this;
            this.queryServer(data, 'deleteLayer.php', function (response) {
                var result = JSON.parse(response);
                if (result.status) {
                    handle.getUserData();
                } else {
                    window.console.log('Failed to delete marker.');
                }
            });
        },
        getLayerByID: function (LayerID) {
            var user = this.model.get('user');
            for (var i = 0; i < user.layers.length; i++) {
                var layer = user.layers[i];
                if (layer.LayerID === LayerID) {
                    return layer;
                }
            }
            return null;
        },
        shareLinkDialog: function (LayerID) {
            var layer = this.getLayerByID(LayerID);
            if (layer.ShareID !== null) {
                this.closeDialog();
                this.openDialog();
                //window.console.log('Layer info: ' + JSON.stringify(layer));
                $('#share-layer-name').html(layer.Description);
                $('#share-mailto-link').prop("href", "mailto:?subject=ownMapp%20Link%20&body=" + this.getURL() + '/map.php?ShareID=' + layer.ShareID);
                $('#share-link').prop("href", this.getURL() + '/map.php?ShareID=' + layer.ShareID);
                $('#share-link-dialog').fadeIn(300);
            }
        },
        shareUserLayer: function (event) {
            var LayerID = event.target.id.substr(12); // extract the LayerID from the DOM element ID
            //window.console.log('Sharing LayerID: ' + LayerID);
            var shareState = 0; // No boolean in SQLite
            var targetLayer = this.getLayerByID(LayerID);
            //window.console.log('Layer: ' + JSON.stringify(targetLayer));
            if (targetLayer.ShareID === null) {
                shareState = 1; // No boolean in SQLite
                //window.console.log('Turning sharing on');
            } else {
                //window.console.log('Turning sharing off');
            }
            var data = {
                authtoken: this.model.get('authtoken'),
                LayerID: LayerID,
                shareState: shareState
            };
            var handle = this;
            this.queryServer(data, 'shareLayer.php', function (response) {
                var result = JSON.parse(response);
                if (result.status) {
                    handle.getUserData();
                    handle.shareLinkDialog(targetLayer.LayerID);
                } else {
                    window.console.log('Failed to modify layer share.');
                }
            });
        },
        addMarker: function (event) {
            this.model.set('addMarkerLinkID', event.target.id);
            $('#cd-menu-trigger').click(); // Close menu
            var map = this.model.get('map');
            var handle = this;
            var mapClickHandlerID = map.on('click', function (evt) {
                handle.newMarkerDialog(evt.coordinate);
            });
            this.model.set('mapClickHandlerID', mapClickHandlerID);
            this.model.set('map', map);
        },
        stopMarker: function () {
            var map = this.model.get('map');
            map.unByKey(this.model.get('mapClickHandlerID'));
            this.model.set('map', map);
        },
        saveMarker: function (markerInfo) {
            var data = {
                authtoken: this.model.get('authtoken'),
                markerInfo: markerInfo
            };

            var handle = this;
            this.queryServer(data, 'saveMarker.php', function (response) {
                //window.console.log('description: '+markerInfo.Description);
                var result = JSON.parse(response);
                if (result.status) {
                    handle.getUserData();
                    //window.console.log('marker descr: ' + markerInfo.Description);
                } else {
                    window.console.log('Failed to save marker.');
                }
            });
        },
        getMyMarkers: function () {
            var map = this.model.get('map');
            var layers = map.getLayers();
            var myLayer;
            layers.forEach(function (layer, idx, layers) {
                //window.console.log('layer ' + layer.get('name'));
                if (layer.get('name') === 'MyMarkers') {
                    myLayer = layer;
                }
            });
            return myLayer;
        },
        openDialog: function () {
            $('#mask').click(); // Close menu
            $('#dialog-container').show();
            $('#mask').fadeIn(300);
            $('#dialog-closer').show();
        },
        closeDialog: function () {
            $('#mask').click(); // Close menu
            $('#passwordcheck').css('color', '#FFFFFF');
            $('#dialog-container').hide();
            $('#dialog-container').children().hide();
            $('#mask, .login-popup').hide();
            // Clear form fields
            $('#passwordcheck').val('');
            $('#password').val('');
            $('#reset-passwordcheck').val('');
            $('#reset-password').val('');
            $('#current-password').val('');

        },
        loginDialog: function () {
            this.closeDialog();
            $('#login-box').fadeIn(300);
            $('#username').focus();
            //Set the center alignment padding + border see css style
            var popMargTop = ($('#login-box').height() + 24) / 2;
            var popMargLeft = ($('#login-box').width() + 24) / 2;

            $('#login-box').css({
                'margin-top': -popMargTop,
                'margin-left': -popMargLeft
            });

            // Add the mask to body
            $('#mask').fadeIn(300);
            return false;
        },
        anonymousLogin: function () {
            window.location.reload();
        },
        verifyAccount: function () {
            var username = $('#username').val();
            var password = $('#password').val();
            this.closeDialog();
            var credentials = {
                username: username,
                password: password
            };
            var handle = this;
            this.queryServer(credentials, 'verifyAccount.php', function (response) {
                //window.console.log(response);
                var result = JSON.parse(response);
                if (result.valid) {
                    handle.setAuthToken(result.authtoken);
                    var user = handle.model.get('user');
                    user.name = result.displayname;
                    handle.model.set('user', user);
                    handle.userControlConfig('authenticated');
                    handle.getUserData();
                    window.location.reload();
                } else {
                    alert('Incorrect username/password.');
                }
            });

        },
        registerAccount: function () {
            this.closeDialog();
            $('#register-box').fadeIn(300);
            //Set the center alignment padding + border see css style
            var popMargTop = ($('#register-box').height() + 24) / 2;
            var popMargLeft = ($('#register-box').width() + 24) / 2;

            $('#register-box').css({
                'margin-top': -popMargTop,
                'margin-left': -popMargLeft
            });
            // Add the mask to body
            $('#mask').fadeIn(300);
        },
        createAccount: function (accountType) {
            if (accountType === 'anonymous') {
                var username = this.uniqID();
                var displayname = 'Anonymous';
                var password = this.uniqID();
                var passwordcheck = password;
            } else {
                var displayname = $('#displayname').val();
                var username = $('#newusername').val();
                var password = $('#newpassword').val();
                var passwordcheck = $('#passwordcheck').val();
            }
            if (password === passwordcheck) {
                this.closeDialog();
                $('#passwordcheck').css('color', '#FFFFFF');
                var credentials = {
                    username: username,
                    password: password,
                    displayname: displayname
                };
                var handle = this;
                this.queryServer(credentials, 'createAccount.php', function (response) {
                    var result = JSON.parse(response);
                    if (result.status) {
                        handle.setAuthToken(result.authtoken);
                        var user = handle.model.get('user');
                        user.name = credentials.displayname;
                        handle.model.set('user', user);
                        handle.userControlConfig('authenticated');
                        handle.getUserData();
                    } else {
                        alert('Username already registered.');
                    }
                });

            } else {
                $('#passwordcheck').css('color', '#FF0000');
                //alert('Passwords do not match!');
            }
        },
        resetPassword: function () {            
            var currentPassword = $('#current-password').val();
            var newPassword = $('#reset-password').val();
            var passwordcheck = $('#reset-passwordcheck').val();
            if (newPassword === passwordcheck) {
                this.closeDialog();
                $('#reset-passwordcheck').css('color', '#FFFFFF');
                var passwordChange = {
                    authtoken: this.model.get('authtoken'),
                    currentPassword: currentPassword,
                    newPassword: newPassword
                };
                
                var handle = this;
                this.queryServer(passwordChange, 'changePassword.php', function (response) {
                    var result = JSON.parse(response);
                    if (result.status) {
                        alert('Password successfully changed.');
                    } else {
                        alert('Password change failed.');
                    }
                });
            } else {
                $('#reset-passwordcheck').css('color', '#FF0000');
                //alert('Passwords do not match!');
            }
        },
        setAuthToken: function (authtoken) {
            this.model.set('authtoken', authtoken);
            this.updateCookie();
        },
        verifyLoginOnLoad: function () {
            if (this.model.has('authtoken')) {
                var authtoken = this.model.get('authtoken');
                var authtoken = {
                    authtoken: authtoken
                };
                var handle = this;
                this.queryServer(authtoken, 'validateAuthToken.php', function (response) {
                    //window.console.log(response);
                    var result = JSON.parse(response);
                    if (result.status) {
                        var user = handle.model.get('user');
                        user.name = result.displayname;
                        handle.model.set('user', user);
                        handle.userControlConfig('authenticated');
                        handle.getUserData();
                    } else {
                        window.console.log('AuthToken invalid.');
                        handle.createAccount('anonymous');
                        //handle.userControlConfig('anonymous');
                        // TODO: configure new temporary user
                    }
                });
            } else {
                this.createAccount('anonymous');
            }
        },
        getMyMarkersLayerID: function () {
            var user = this.model.get('user');
            for (var i = 0; i < user.layers.length; i++) {
                if (user.layers[i].Type === 'myMarkers') {
                    return user.layers[i].LayerID;
                }
            }
            return null;
        },
        getMyLocationLayerID: function () {
            var user = this.model.get('user');
            for (var i = 0; i < user.layers.length; i++) {
                if (user.layers[i].Type === 'userLocation') {
                    return user.layers[i].LayerID;
                }
            }
            return null;
        },
        toggleAutoShareUpdate: function (enabled) {
            var autoShareState;
            if (typeof (enabled) === 'undefined') {
                if (this.model.has('sharesUpdateID')) {
                    autoShareState = false;
                } else {
                    autoShareState = true;
                }
            } else {
                if (this.model.has('sharesUpdateID') && !enabled) {
                    autoShareState = false;
                }
                if (!this.model.has('sharesUpdateID') && enabled) {
                    autoShareState = true;
                }
            }
            if (autoShareState) {
                var handle = this;
                this.model.set('sharesUpdateID', setInterval(function () {
                    handle.getUserData();
                }, 1000 * this.model.get('sharesUpdateInterval')));
                $('#auto-update-shares').html('Disable auto-update');

            } else {
                clearInterval(this.model.get('sharesUpdateID'));
                this.model.unset('sharesUpdateID');
                $('#auto-update-shares').html('Enable auto-update');
            }
            this.model.set('autoUpdateShareState', autoShareState);
        },
        getUserData: function () {
            var newShareID = $('#new-share-id').html(); //get share ID for share in URL
            var authtoken = this.model.get('authtoken');
            var data = {
                authtoken: authtoken,
                newShareID: newShareID
            };
            var handle = this;
            this.queryServerSynchronous(data, 'getUserData.php', function (response) {
                //window.console.log(response);
                var result = JSON.parse(response);
                if (result.status) {
                    var user = handle.model.get('user');
                    var shares = handle.model.get('shares');
                    user.name = result.user.DisplayName;
                    user.layers = result.layers;
                    user.markers = result.markers;
                    handle.model.set('user', user);
                    // TODO:  make the dialog nicer.
                    var shares = result.shares;
                    for (var i = 0; i < shares.length; i++) {
                        window.console.log('share: ' + JSON.stringify(shares[i].Accepted));
                        if (parseInt(shares[i].Accepted) === 0) {
                            var answer = confirm(shares[i].OwnerName + ' wants to share ' + shares[i].Description + '. Add layer?');
                            if (answer) {
                                shares[i].Accepted = 1;
                                handle.toggleAutoShareUpdate(true);
                            } else {
                                shares[i].Accepted = 2;
                            }
                        }
                    }
                    handle.model.set('shares', shares);
                    // TODO: update the shares table with the shares acceptance state   
                    handle.updateShareAcceptance();

                    handle.updateMapLayers();
                    handle.updateMenuLayers();
                } else {
                    window.console.log('Get user data failed.');
                }
            });
        },
        updateShareAcceptance: function () {
            var shares = this.model.get('shares');
            var shareData = [];
            for (var i = 0; i < shares.length; i++) {
                shareData.push({
                    ShareID: shares[i].ShareID,
                    Accepted: shares[i].Accepted
                });
            }
            var data = {
                authtoken: this.model.get('authtoken'),
                shareData: shareData
            };
            //window.console.log('data: ' + JSON.stringify(data));
            this.queryServer(data, 'updateShareAcceptance.php', function (response) {
                //window.console.log(response);
                var result = JSON.parse(response);
                if (result.status) {
                    //window.console.log('Share acceptance updated successfully.');
                } else {
                    window.console.log('Share acceptance update failed.');
                }
            });
        },
        userControlConfig: function (userState) {
            var user = this.model.get('user');
            switch (userState) {
                case 'authenticated':
                    $('#login-button-top').html(user.name);
                    $('#logout-menu-item').html('Logout ' + user.name);
                    $('#logout-menu-item').show();
                    $('#layer-menu').show();
                    $('#share-menu').show();
                    $('#login-button-menu').hide();
                    break;
                case 'logout':
                    this.closeDialog();
                    $('#login-button-top').html('');
                    $('#mask').click();
                    $('#logout-menu-item').html('Logout');
                    $('#logout-menu-item').hide();
                    $('#layer-menu').hide();
                    $('#share-menu').hide();
                    $('#login-button-menu').show();
                    break;
                default:
                    break;
            }
        },
        logout: function () {
            var answer = confirm("Are you sure you want to logout?");
            if (answer) {
                this.model.unset('authtoken');
                this.userControlConfig('logout');
                docCookies.removeItem("oMCookie");
            }
        },
        /*
         * Toggles the visibility of the selected layer
         * TODO: Update this function to toggle the view of the layer associated
         * with the button clicked
         * @returns {undefined}
         */
        toggleLayerVisiblity: function () {
            if ($('#mymarkers-visibility').html() === 'Hide') {
                $('#mymarkers-visibility').html('Show');
                var visibility = false;
            } else {
                $('#mymarkers-visibility').html('Hide');
                var visibility = true;
            }
            var map = this.model.get('map');
            var layers = map.getLayers();
            layers.forEach(function (layer, idx, layers) {
                if (layer.get('name') === 'MyMarkers') {
                    layer.setVisible(visibility);
                    if (visibility) {
                        //window.console.log(JSON.stringify(layer.getOpacity()));
                        //map.zoomToExtent(layer.getExtent());
                    }
                }
            }, this);
            this.model.set('map', map);

        },
        followToggle: function () {
            var follow = this.model.get('follow');
            if (follow) {
                $('#follow-toggle').html('Follow...');
                this.model.set('follow', false);
            } else {
                $('#follow-toggle').html('Stop following...');
                this.model.set('follow', true);
            }
        },
        refreshLateralMenu: function () {

            //open (or close) submenu items in the lateral menu. Close all the other open submenu items.
            var kids = $('.item-has-children').children('a');
            //window.console.log('kids.length: ' +kids.length);
            for (var i = 0; i < kids.length; i++) {
                //window.console.log('kid: ' +$(kids[i]).html());
                if (!($(kids[i]).hasClass('delete-marker') || $(kids[i]).hasClass('center-marker'))) {
                    //window.console.log('does not have delete/center-marker: ' + $(kids[i]).html());
                    $(kids[i]).off('click');
                }
                $(kids[i]).on('click', function (event) {
                    event.preventDefault();
                    $(this).toggleClass('submenu-open').next('.sub-menu').slideToggle(200).end().parent('.item-has-children').siblings('.item-has-children').children('a').removeClass('submenu-open').next('.sub-menu').slideUp(200);
                });
            }
        },
        addDeleteMarkerListener: function (markerID) {
            var markerMenuItem = document.getElementById(markerID);
            var links = $(markerMenuItem).find('a');
            for (var i = 0; i < links.length; i++) {
                if ($(links[i]).hasClass('delete-marker')) {
                    var handle = this;
                    $(links[i]).on('click', function (event) {
                        event.preventDefault();
                        handle.deleteMarker(markerID);
                    });
                }
            }
        },
        addCenterMarkerListener: function (markerID) {
            var markerMenuItem = document.getElementById(markerID);
            var links = $(markerMenuItem).find('a');
            for (var i = 0; i < links.length; i++) {
                if ($(links[i]).hasClass('center-marker')) {
                    //window.console.log('centerControl: ' + $(links[i]).html());
                    var handle = this;
                    $(links[i]).on('click', function (event) {
                        event.preventDefault();
                        handle.centerMarker(markerID);
                    });
                }
            }
        },
        centerMarker: function (markerID) {
            window.console.log('center on marker: ' + markerID);
            $('#cd-menu-trigger').click(); // Close menu
            var targetCoords = null;
            var map = this.model.get('map');
            //window.console.log('Destination markerID: ' + markerID);
            var user = this.model.get('user');
            var markersForEachLayer = user.markers;
            for (var i = 0; i < markersForEachLayer.length; i++) {
                var markers = markersForEachLayer[i];
                for (var k = 0; k < markers.length; k++) {
                    var marker = markers[k];
                    if (marker.MarkerID === markerID) {
                        targetCoords = [parseFloat(marker.Lat), parseFloat(marker.Lon)];
                    }
                }
            }
            if (targetCoords === null) {
                var shares = this.model.get('shares');
                for (var i = 0; i < shares.length; i++) {
                    if (parseInt(shares[i].Accepted) === 1) {
                        for (var k = 0; k < shares[i].markers.length; k++) {
                            var marker = shares[i].markers[k];
                            if (marker.MarkerID === markerID) {
                                targetCoords = [parseFloat(marker.Lat), parseFloat(marker.Lon)];
                            }
                        }
                    }
                }
            }
            if (targetCoords !== null) {
                var view = map.getView();
                var duration = 5000;
                var start = +new Date();
                var pan = ol.animation.pan({
                    duration: duration,
                    source: view.getCenter(),
                    start: start
                });
                var bounce = ol.animation.bounce({
                    duration: duration,
                    resolution: 4 * view.getResolution(),
                    start: start
                });
                var zoom = ol.animation.zoom({
                    duration: duration,
                    resolution: view.getResolution(),
                    start: start
                });
                var rotate = ol.animation.rotate({
                    duration: duration,
                    rotation: 2 * 3.141592,
                    start: start
                });
                map.beforeRender(pan, bounce, zoom);
                view.setCenter(targetCoords);
                //view.setResolution(view.getResolution() / 2);
                view.setZoom(15);
            }
        },
        /*
         * Deletes marker from the map and database.
         * TODO: fix the delete function now that there are multiple layers.
         * @param {type} markerID
         * @returns {undefined}
         */
        deleteMarker: function (markerID) {
            // Delete marker from server database
            var data = {
                authtoken: this.model.get('authtoken'),
                MarkerID: markerID
            };
            var handle = this;
            this.queryServer(data, 'deleteMarker.php', function (response) {
                var result = JSON.parse(response);
                if (result.status) {
                    // If database deletion was successful, remove marker from map layer
                    handle.getUserData();
                } else {
                    window.console.log('Marker deletion failed.');
                }
            });
        },
        createLayer: function () {
            var layerDesc = this.model.get('newLayerDescription');
            var data = {
                authtoken: this.model.get('authtoken'),
                layerInfo: {
                    Type: 'custom',
                    Description: layerDesc
                }
            };
            var handle = this;
            this.queryServer(data, 'saveLayer.php', function (response) {
                var result = JSON.parse(response);
                if (result.status) {
                    handle.getUserData();
                    //window.console.log('Layer created!');
                } else {
                    window.console.log('Layer creation failed.');
                }
            });
        },
        newMarkerDialog: function (coordinates) {
            this.model.set('newMarkerCoordinates', coordinates);
            this.closeDialog();
            this.openDialog();
            $('#new-marker-dialog').show();
        },
        newMarkerDialogSubmit: function () {
            this.model.set('newMarkerDescription', $('#new-marker-description').val());
            this.closeDialog();
            var coordinates = this.model.get('newMarkerCoordinates');
            var addMarkerLinkID = this.model.get('addMarkerLinkID');
            var LayerID = addMarkerLinkID.substr(11); //extract the LayerID from the "layer-add-LAYERID" DOM element ID
            var markerInfo = {
                LayerID: LayerID,
                Lat: coordinates[0],
                Lon: coordinates[1],
                Type: 'Static',
                Description: this.model.get('newMarkerDescription')
            };
            this.saveMarker(markerInfo);
            this.stopMarker();
        },
        newMarkerDialogCancel: function () {
            this.model.unset('newMarkerCoordinates');
            this.closeDialog();
            this.stopMarker();
        },
        helpDialog: function () {
            this.closeDialog();
            this.openDialog();
            $('#help-dialog').fadeIn(300);
        },
        settingsDialog: function () {
            this.closeDialog();
            this.openDialog();
            $('#settings-dialog').fadeIn(300);
        },
        openLog: function () {
            this.closeDialog();
            this.openDialog();
            $('#log-viewer').fadeIn(300);
        },
        log: function (msg) {
            var timestamp = (new Date()).toISOString();
            var curLog = $('#log-viewer').html();
            $('#log-viewer').append('<p>' + timestamp + ': ' + msg + '</p>');
        },
        simulateLocation: function () {
            var coordinates = this.model.get('simulationData');

            var first = coordinates.shift();
            this.simulatePositionChange(first);
            var handle = this;
            var prevDate = first.timestamp;
            function geolocate() {
                var position = coordinates.shift();
                if (!position) {
                    return;
                }
                var newDate = position.timestamp;
                handle.simulatePositionChange(position);
                window.setTimeout(function () {
                    prevDate = newDate;
                    geolocate();
                }, (newDate - prevDate) / 0.5);
            }
            geolocate();
            this.model.set('simulatingLocation', true);
            $('#toggle-tracking').click(); // Simulate "Track me" button
            this.closeDialog(); // Close menu
        },
        simulatePositionChange: function (position) {
            var geolocation = this.model.get('geolocation');
            var coords = position.coords;
            geolocation.set('accuracy', coords.accuracy);
            geolocation.set('heading', this.degToRad(coords.heading));
            var position_ = [coords.longitude, coords.latitude];
            var projectedPosition = ol.proj.transform(position_, 'EPSG:4326',
                    'EPSG:3857');
            geolocation.set('position', projectedPosition);
            geolocation.set('speed', coords.speed);
            geolocation.changed();
        }
    });
    // Start the engines
    $(init);
})(jQuery);
