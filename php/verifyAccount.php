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
        $verification = verifyAccount($data['username'], getPasswordHash($data['password']));

        if ($verification['valid']) {
            $authtoken = generateAuthToken($verification['UserID']);
            echo json_encode(array('UserID' => $verification['UserID'], 'displayname' => $verification['displayname'], 'authtoken' => $authtoken, 'valid' => true));
        } else {
            echo json_encode(array('UserID' => 0, 'displayname' => '', 'authtoken' => 0, 'valid' => false));
        }
    }
} else {
    //echo 'Error: Nothing POSTed.';
}
?>


