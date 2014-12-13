<html>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/> <!--320-->
<head>
	<title>ownMapp</title>

	<link href='https://api.tiles.mapbox.com/mapbox.js/v0.6.7/mapbox.css' rel='stylesheet' />
	<link href='https://fonts.googleapis.com/css?family=Open+Sans+Condensed:700|Open+Sans:400,600' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" href="css/icons/style.css" />
    <link rel="stylesheet" href="css/style.css" type="text/css" />
    <link rel="stylesheet" href="css/mapbox.share.css" type="text/css" />

</head>	

<body>

	<div id="header">
<!--            <h1><a id="home-url" href="">ownMapp</a></h1>-->
            <h1 id="home-url">Menu</h1>
	</div>

	<div id="content" class="hide">
	    
		<div id="controls">
			<div id="basic-controls" class="pad">
                                <a href="#" id="toggle-location" class="button red block" data-nofollow>Locate me!</a>
                                <div id="coordinates" class="hide"></div>
				<a href="#" id="add-marker" class="icon-marker button blue block" data-nofollow>Add marker</a>
				<a href="#" id="show-all" class="button blue block show-all" data-nofollow>Center map</a>
                                <a href="#" id="share-location" class="button blue block show-all" data-nofollow>Share</a>
                                
                                <div id="shared-map" class="hide"></div>
                                <div id="share-info" class="hide">
                                    <a id="share-url" class="button green subbutton" href="">Share this link.</a>
                                </div>
				<a href="#" id="clear-cookie" class="button gray block show-all" data-nofollow>Clear map and reset</a>
                                <div id="map-size" class="box hide">
					<h3>SIZE <span>(px)</h3>
					<input type="number" id="map-width" placeholder="width" class="change-size" />
					<span class="x">X</span>

					<input type="number" id="map-height" placeholder="height" class="change-size" />
				</div>
			</div>

			<div id="adding-marker" class="hide">
				<h2 class="title">Place marker</h2>
				<div class="pad">
					<p class="info">Click and hold to place a marker on the map.</p>
					<a href="#" id="cancel-marker" class="button block" data-nofollow>Cancel</a>
				</div>
			</div>

			<div id="edit-marker" class="clearfix hide">
				<h2 class="title">Edit marker</h2>
				
				<div class="pad clearfix">
					<fieldset class="clearfix">
						<label for="color" class="left">Color</label>
						<select name="color" id="marker-color">
							<option value="3178b5" selected>Blue</option>
							<option value="000000">Black</option>
							<option value="dc463f">Red</option>
							<option value="5ea154">Green</option>
							<option value="f8b44e">Orange</option>
						</select>
					</fieldset>

					<fieldset class="clearfix">
						<label for="icon" class="left">Icon</label>
						<select name="icon" id="marker-icon">
							<!-- Markers load here -->
						</select>
					</fieldset>

					<fieldset>
						<label for="marker-content">Tooltip Content</label>
						<textarea name="marker-content" id="" rows="3" placeholder="(HTML is allowed)"></textarea>
					</fieldset>
					
					<a href="#" id="delete-marker" class="button" data-nofollow>Delete</a>
					<a href="#" id="save-marker" class="button blue" data-nofollow>Save</a>
				</div>
				
			</div>
		</div>

		<div id="error" class="hide"></div>
		
		<!-- Sharing Options 
		<div id="save" class="clearfix">
			<h3 class="title hide">Share</h3>
			<div class="buttons clearfix hide">
				<a href="#" id="generate-image" class="button icon-download" data-nofollow>Image</a>
				<a href="#" id="generate-embed" class="button icon-embed" data-nofollow>Embed</a>
			</div>

			<div id="share-code" class="hide">
				
				<p>Copy and paste the following HTML:</p>
				<textarea id="generate-result"></textarea>
				
			</div>

		</div>
                -->

	</div>
	
	<div id="map-wrapper" class="no-box-size">
		<div id="map" class="map"><!-- Load MapBox Map--></div>
	</div>
	


<!-- JS Scripts -->

<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script src="js/third-party/underscore-min.js"></script>
<script src="js/third-party/backbone-min.js"></script>
<script src="js/third-party/cookies.js"></script>
<script src="js/third-party/taffy-min.js"></script>
<script src='https://api.tiles.mapbox.com/mapbox.js/v0.6.7/mapbox.js'></script>
<!--<script src="js/third-party/mapbox-full.js"></script>-->
<script src="js/locator.js"></script>

</body>

</html>
