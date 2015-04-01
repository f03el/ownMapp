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
        $UserID = getUserIDFromAuthtokenData($data['authtoken']);
        if ($UserID !== null) {
            $layerInfo = $data['layerInfo'];
            $LayerID = createNewLayer($UserID, $layerInfo['Type'], $layerInfo['Description']);
            if ($LayerID !== null) {
                echo json_encode(array('LayerID' => $LayerID, 'status' => true));
            } else {
                echo json_encode(array('status' => false));
            }
        } else {
            echo json_encode(array('status' => false));
        }
    }
} else {
    //echo 'Error: Nothing POSTed.';
}
?>
