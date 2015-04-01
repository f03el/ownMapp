<?php

include_once('db.php');
$p = array();

if ($_POST) {
    // Get the value of all POST items
    foreach ($_POST as $key => $value) {
        $p[$key] = $value;
    }

    if (array_key_exists("data", $p) && !empty($p["data"])) {
        $data = json_decode($p['data'], true);
        $UserID = getUserIDFromAuthtokenData($data['authtoken']);
        if ($UserID !== null) {
            $status = shareLayer($UserID, $data['LayerID'], $data['shareState']);
            if ($status) {
                echo json_encode(array('status' => true));
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


