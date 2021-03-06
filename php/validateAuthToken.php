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
        $validation = validateAuthToken($data['authtoken']);

        if ($validation['valid']) {
            echo json_encode(array('displayname' => $validation['displayname'], 'status' => true));
        } else {
            echo json_encode(array('displayname' => '', 'status' => false));
        }
    }
} else {
    //echo 'Error: Nothing POSTed.';
}
?>


