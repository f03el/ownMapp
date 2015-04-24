<html>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/> <!--320-->
    <head>
        <title>ownMapp</title>

        <link href='https://api.tiles.mapbox.com/mapbox.js/v0.6.7/mapbox.css' rel='stylesheet' />
        <link href='https://fonts.googleapis.com/css?family=Open+Sans+Condensed:700|Open+Sans:400,600' rel='stylesheet' type='text/css'>
        <link rel="stylesheet" href="css/icons/style.css" />
        <link rel="stylesheet" href="css/map.css"> <!-- CSS map -->
        <link rel="stylesheet" href="css/reset.css"> <!-- CSS reset -->
        <link rel="stylesheet" href="css/style.css"> <!-- Resource style -->
        <script src="js/third-party/modernizr.js"></script> <!-- Modernizr -->

    </head>	

    <body>
        <header>
                        <!--<a id="cd-logo" href="#"><img src="img/map.png" alt="ownMapp" height="30px"></a>-->
            <div id="site-title">ownMapp</div>
            <nav id="cd-top-nav">
                <ul>
                    <li><img src="img/map.png" alt="ownMapp" height="20px" id="tracking-info" style="display: none;"></img></li>
                    <li><a href="#" id="login-button-top">Login</a></li>
                </ul>
            </nav>
            <a id="cd-menu-trigger" href="#"><span class="cd-menu-text">Menu</span><span class="cd-menu-icon"></span></a>
        </header>
        <main class="cd-main-content">

            <!--<br><br><br><br>-->
            <!--<div id="map-container">-->
            <div id="map" class="map">
                <div id="info"></div>
                <div id="marker" title="Marker" class="hide"></div> 
                <div id="login-box" class="login-popup">
                    <a href="#" class="close"><img src="img/close_pop.png" class="btn_close" title="Close Window" alt="Close" /></a>
                    <form method="post" class="signin" action="#">
                        <fieldset class="textbox">
                            <label class="username">
                                <span>Username or email</span>
                                <input id="username" name="username" value="" type="text" autocomplete="on" placeholder="Username">
                            </label>
                            <label class="password">
                                <span>Password</span>
                                <input id="password" name="password" value="" type="password" placeholder="Password">
                            </label>
                            <button id="login" class="submit button" type="button">Sign in</button>  <BR>
                            <button id="anonymous-login" class="submit button" type="button">Anonymous</button>  <BR>
                            <button id="register" class="submit button" type="button">Register</button>  
                        </fieldset>
                    </form>
                </div>


                <div id="register-box" class="login-popup">
                    <a href="#" class="close"><img src="img/close_pop.png" class="btn_close" title="Close Window" alt="Close" /></a>
                    <form method="post" class="signin" action="#">
                        <fieldset class="textbox">
                            <label class="username">
                                <span>Display Name</span>
                                <input id="displayname" name="displayname" value="" type="text" autocomplete="on" placeholder="Eliza">
                            </label>
                            <label class="username">
                                <span>Username or email</span>
                                <input id="newusername" name="username" value="" type="text" autocomplete="on" placeholder="Username">
                            </label>
                            <label class="password">
                                <span>Password</span>
                                <input id="newpassword" name="password" value="" type="password" placeholder="UniquePassword!">
                            </label>
                            <label class="password">
                                <span>Verify password</span>
                                <input id="passwordcheck" name="passwordcheck" value="" type="password" placeholder="UniquePassword!">
                            </label>
                            <button id="create-account" class="submit button" type="button">Create Account</button>  
                        </fieldset>
                    </form>
                </div>

                <div id="mask" class="hide"></div>
                <div id="dialog-container" class="hide">
                    <div class="hide dialog" id="log-viewer">
                            <h1>Log</h1>
                    </div>
                    <div class="hide dialog" id="share-link-dialog">
                            <h1>Layer Share</h1>
                            <p>To share the layer</p>
                            <p id="share-layer-name" style='font-weight: bold;'></p>
                            <p><a href="" id="share-mailto-link">click here to email a link</a></p>
                            <p>or</p>
                            <p><a href="" id="share-link">share this direct link</a></p>
                            <p></p>
                    </div>
                    <div class="hide dialog" id="new-layer-dialog">
                            <h1>Add Layer</h1>
                            <form>
                            <input id="new-layer-description" name="newlayerdescription" value="" type="text" placeholder="Layer name"><br>
                            <button id="update-layer" class="submit button" type="button">Create Layer</button><br>
                            <button id="cancel-layer" class="submit button" type="button">Cancel</button>
                            </form>
                    </div>
                    <div class="hide dialog" id="new-marker-dialog">
                            <h1>Add marker</h1>
                            <form>
                            <input id="new-marker-description" name="newmarkerdescription" value="" type="text" placeholder="Marker name"><br>
                            <button id="update-marker" class="submit button" type="button">Create Marker</button><br>
                            <button id="cancel-marker" class="submit button" type="button">Cancel</button>
                            </form>
                    </div>
                    <div class="hide dialog" id="help-dialog">
                            <h1>ownMapp Help</h1>
                            <p><a href="/">ownMapp</a> allows you to track your current location, save markers of static locations,
                                and share these locations with others. 
                            </p><p>
                                You can create a user account or use the anonymous default. The advantage of the 
                                user account is that your data is persistent; anonymous account data will become 
                                inaccessible either when you clear your browser cookies or your one-time authentication 
                                token expires after a few days.
                            </p><p>
                                To share your location, ensure your location has been acquired and mapped. Then click
                                the Share button and send the provided link. 
                            </p><p>
                                You can save static locations by clicking the Add Marker button and entering a name for
                                the new marker. Click the position where you want to pin the marker
                                permanently to the map.
                            </p><p>                                
                            </p>
                    </div>
                    <div class="hide dialog" id="settings-dialog">
                            <h1>Settings</h1>
                            <p>Start a simulation of location tracking for demo or testing purposes:                               
                                <a href="#" id="start-simulation">Start simulation...</a>
                            </p><p>                                
                            </p>
                    </div>
                    <div class="hide" id="dialog-closer"><a href="#">X</a></div>
                </div>
            </div>
            <!--</div>-->

        </main> <!-- cd-main-content -->

        <nav id="cd-lateral-nav">
            <ul class="cd-navigation">
                <li class="item-has-children">
                    <a href="#">My Location</a>
                    <ul class="sub-menu">
                        <li><a href="#" id="toggle-tracking" >Start tracking...</a></li>
                        <li><a href="#" id="follow-toggle">Stop following...</a></li>
                    </ul>
                </li> <!-- item-has-children -->

                <li class="item-has-children" id="share-menu">
                    <a href="#">Share Location...</a>
                    <ul class="sub-menu">
                        <li><a href="#" id="share-location">Start sharing...</a></li>
                        <div id="share-info" class="hide">
                            <a id="share-url" class="button green subbutton" href="">Share this link.</a>
                        </div>
                        <div id="shared-map" class="hide">

                        </div>
                    </ul>
                </li> <!-- item-has-children -->
                <li class="item-has-children" id="layer-menu">
                    <a href="#">Layers</a>
                    <ul class="sub-menu">
                        <li class="item-has-children" id="my-markers">
                            <a href="#" >MyMarkers</a>
                            <ul class="sub-menu">
                                <li><a href="#" class="control-button" id="mymarkers-visibility">Hide</a></li>
                                <li><a href="#" class="control-button" id="mymarkers-share">Share</a></li>
                                <li><a href="#" class="control-button" id="add-marker">Add marker...</a></li>
                            </ul>
                        </li> <!-- item-has-children -->

                        <li><a href="#" id="add-layer">Add layer...</a></li>

                    </ul>
                </li> <!-- item-has-children -->
                <li class="item-has-children" id="shares-menu">
                    <a href="#">Shared with Me</a>
                    <ul class="sub-menu">
                        <li><a href="#" id="auto-update-shares">Enable auto-update</a></li>
                        <!--  Outline of shared layer menu grouped by user instead
                                of a flat list of shared layers
                        <li class="item-has-children user-share">
                            <a href="#" >First User</a>
                            <ul class="sub-menu">
                                <li class="item-has-children user-share">
                                    <a href="#">First Layer</a>
                                    <ul class="sub-menu">
                                        <li><a href="#" class="control-button">Hide</a></li>
                                        <li><a href="#" class="control-button">Remove</a></li>
                                    </ul>
                                    <a href="#">Second Layer</a>
                                    <ul class="sub-menu">
                                        <li><a href="#" class="control-button">Hide</a></li>
                                        <li><a href="#" class="control-button">Remove</a></li>
                                    </ul>
                                </li> 
                            </ul>
                        </li> 
                        -->
                    </ul>
                </li> <!-- item-has-children -->
            </ul> <!-- cd-navigation -->

            <ul class="cd-navigation cd-single-item-wrapper">
                <li><a href="#" id="open-settings">Settings</a></li>
                <li><a href="#" id="open-help">Help</a></li>
                <li><a href="#" id="open-log">Log</a></li>
                <li><a href="#" id="logout-menu-item">Logout</a></li>
                <li><a href="#" id="login-button-menu">Login</a></li>
            </ul> <!-- cd-single-item-wrapper -->
            <!--
            <div class="cd-navigation socials">
                    <a class="cd-github cd-img-replace" href="#">GitHub</a>
            </div>  socials 
            -->
            
        </nav>
        
        <div id="new-share-id" style="display: none;"><?php include('php/checkForShare.php');?></div>

        <!-- JS Scripts -->

        <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
        <script src="js/third-party/underscore-min.js"></script>
        <script src="js/third-party/backbone-min.js"></script>
        <script src="js/third-party/cookies.js"></script>
        <script src="js/third-party/ol.js" type="text/javascript"></script>        
        <script src="js/map.js?<?php include('php/version.php'); echo 'v' . $VERSION; ?>"></script>
        <script src="js/third-party/main.js"></script> 

    </body>

</html>
