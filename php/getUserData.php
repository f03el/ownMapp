<?php

include_once('db.php');
$p = array();

if ($_POST) {
    // Get the value of all POST items
    foreach ($_POST as $key => $value) {
        $p[$key] = $value;
    }

    // Get all user data
    if (array_key_exists("data", $p) && !empty($p["data"])) {
        $data = json_decode($p['data'], true);
        $UserID = getUserIDFromAuthtokenData($data['authtoken']);
        $newShareID = rtrim($data['newShareID']);
        if ($UserID !== null) {
            $userData = getAllUserData($UserID, $newShareID);
            if ($userData !== null) {
                echo json_encode(array('user' => $userData['user'], 'layers' => $userData['layers'], 'markers' => $userData['markers'], 'shares' => $userData['shares'], 'status' => true));
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


