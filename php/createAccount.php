<?php

include_once('db.php');
$p = array();

if ($_POST) {
    // Get the value of all POST items
    foreach ($_POST as $key => $value) {
        $p[$key] = $value;
    }
    // Get the user map data
    if (array_key_exists("data", $p) && !empty($p["data"])) {
        $data = json_decode($p['data'], true);
        $UserID = createAccount($data['username'], getPasswordHash($data['password']), $data['displayname']);
        // The user location layer is type 'userLocation'
        $LayerID = createNewLayer($UserID, 'userLocation', $data['displayname']);
        // The user default marker layer is type 'myMarkers'; all others are type 'custom'
        $MarkerLayerID = createNewLayer($UserID, 'myMarkers', 'MyMarkers');
        if ($UserID !== null && $LayerID !== null) {
            $authtoken = generateAuthToken($UserID);
            echo json_encode(array('UserID' => $UserID, 'LayerID' => $LayerID, 'MarkerLayerID' => $MarkerLayerID, 'authtoken' => $authtoken, 'status' => true));
        } else {
            echo json_encode(array('UserID' => 0, 'LayerID' => 0, 'authtoken' => 0, 'status' => false));
        }
    }
} else {
    //echo 'Error: Nothing POSTed.';
}
?>


