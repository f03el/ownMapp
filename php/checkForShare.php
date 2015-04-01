<?php

//include_once('db.php');
$p = array();

if ($_GET) {
    // Get the value of all GET items
    foreach ($_GET as $key => $value) {
        $p[$key] = $value;
    }
    if (array_key_exists("ShareID", $p) && !empty($p["ShareID"])) {
        $ShareID = $p['ShareID'];
    }
    //$TempID = hash('md5', uniqid('', true));
    //$status = addUnacceptedShare($ShareID, $TempID);
    //$newShare = array('status' => $status, 'TempID' => $TempID, 'ShareID' => $ShareID);
    echo $ShareID;
} else {
    //echo 'Error: Nothing to GET.';
}
?>


