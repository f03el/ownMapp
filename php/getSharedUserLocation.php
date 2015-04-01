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
        $result = getSharedUserLocation($data['authtoken'], $data['ShareID']);
        if ($result['status']) {
            echo json_encode(array('Lat' => $result['Lat'], 'Lon' => $result['Lon'], 'Time' => $result['Time'], 'status' => true));
        } else {
            echo json_encode(array('status' => false));
        }
    }
} else {
    //echo 'Error: Nothing POSTed.';
}
?>