<?php

include_once('db.php');
$p = array();

if ($_POST) {
    // Get the value of all POST items
    foreach ($_POST as $key => $value) {
        $p[$key] = $value;
    }

    // Get the user layers data
    if (array_key_exists("data", $p) && !empty($p["data"])) {
        $data = json_decode($p['data'], true);
        $UserID = getUserIDFromAuthtokenData($data['authtoken']);
        if ($UserID !== null) {
            $layers = getUserLayers($UserID);
            if ($layers !== null) {
                echo json_encode(array('layers' => $layers, 'status' => true));
            } else {
                echo json_encode(array('status' => false));
            }
        } else {
            echo json_encode(array('status' => false));
        }
    } else {
        //echo 'Error: Nothing POSTed.';
    }
}
?>


