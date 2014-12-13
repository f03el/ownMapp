<?php

include('./database.php');

$p = array();

if ($_POST) {
    // Get the value of all POST items
    foreach ($_POST as $key => $value) {
            $p[$key] = $value;
    }

    // Get the user map data
    if (array_key_exists("data", $p) && !empty($p["data"]) ) {
            $data = json_decode($p['data'], true);
            $sid = $data['sid'];
            $db = new database("../data/mapdb.json","../data/userdb.json","../data/markerdb.json","../data/sharesdb.json");
            $coords = $db->getSharedCoordinates($sid);
            echo json_encode($coords);
    }
} else {
	//echo 'Error: Nothing POSTed.';
}

?>


