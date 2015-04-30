<?php

// Database location
include('version.php');
$docRoot = str_replace("\\", "/", realpath(dirname(__FILE__) . '/..'));
//define('DBFILE', $docRoot . '/data/ownmapp_v' . $VERSION . '.sqlite3');
define('DBFILE', $docRoot . '/data/ownmapp.sqlite3');

// Define marker types
define('STATIC', 0);
define('DYNAMIC', 1);

function openDB($db_location) {
    // Set default timezone
    date_default_timezone_set('America/New_York');
    try {
        /*         * ************************************
         * Create databases and                *
         * open connections                    *
         * ************************************ */
        // Create (connect to) SQLite database in file
        $db = new PDO('sqlite:' . $db_location);
        // Set errormode to exceptions
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        /*         * ************************************
         * Create tables                       *
         * ************************************ */
        // Create table 'user'
        $db->exec("CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY,
                    password TEXT,
                    displayname TEXT,
                    UserID TEXT,
                    authtime INTEGER,
                    authtoken TEXT)");
        // Create table 'layers'
        $db->exec("CREATE TABLE IF NOT EXISTS layers     (
                    LayerID TEXT PRIMARY KEY,
                    UserID TEXT,
                    ShareID TEXT,
                    Type TEXT,
                    Description TEXT)");
        // Create table 'markers'
        $db->exec("CREATE TABLE IF NOT EXISTS markers     (
                    MarkerID TEXT PRIMARY KEY,
                    LayerID TEXT,
                    Lat REAL,
                    Lon REAL,
                    Time INTEGER,
                    Type INTEGER,
                    Description TEXT)");
        // Create table 'geoloc'
        $db->exec("CREATE TABLE IF NOT EXISTS geoloc     (
                    LocationID TEXT PRIMARY KEY,
                    UserID TEXT,
                    ShareID TEXT,
                    Lat REAL,
                    Lon REAL,
                    Time INTEGER,
                    Accuracy REAL,
                    Heading REAL,
                    Speed REAL)");
        // Create table 'shares'
        $db->exec("CREATE TABLE IF NOT EXISTS shares     (
                    TempID TEXT PRIMARY KEY,
                    UserID TEXT,
                    ShareID TEXT,
                    Accepted INTEGER)");
        return $db;
    } catch (PDOException $e) {
        // Print PDOException message
        echo $e->getMessage();
        return null;
    }
}

function closeDB($db) {
    try {
        // Close file db connection
        $db = null;
        return true;
    } catch (PDOException $e) {
        // Print PDOException message
        echo $e->getMessage();
        return false;
    }
}

function createAccount($username, $password, $displayname) {
    try {
        $db = openDB(DBFILE);
        if ($db == null) {
            return null;
        }
        $uid = null;
        $stmt = $db->prepare("SELECT * FROM users WHERE username=:username");
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        $result = $stmt->fetchAll();
        $numRows = 0;
        foreach ($result as $row) {
            $numRows++;
        }
        //echo json_encode($result['NrRecords']);
        if ($numRows === 0) {
            // Prepare INSERT statement to SQLite3 file db
            $authtoken = newAuthToken();
            $uid = uniqid();
            $authtime = time();
            $insert = "INSERT INTO users (username, password, displayname, UserID, authtime, authtoken)
                VALUES (:username, :password, :displayname, :UserID, :authtime, :authtoken)";
            $stmt = $db->prepare($insert);
            // Bind parameters to statement variables
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':password', $password);
            $stmt->bindParam(':displayname', $displayname);
            $stmt->bindParam(':UserID', $uid);
            $stmt->bindParam(':authtime', $authtime);
            $stmt->bindParam(':authtoken', $authtoken);
            $stmt->execute();
        }
        closeDB($db);
        return $uid;
    } catch (PDOException $e) {
        // Print PDOException message
        echo $e->getMessage();
        return null;
    }
}

function newAuthToken() {
    return hash('sha256', uniqid('', true));
}

function generateAuthToken($UserID) {
    try {
        $db = openDB(DBFILE);
        if ($db == null) {
            return null;
        }
        $authtoken = newAuthToken();
        $stmt = $db->prepare("UPDATE users SET authtoken=:authtoken WHERE UserID=:UserID");
        $stmt->bindParam(':authtoken', $authtoken);
        $stmt->bindParam(':UserID', $UserID);
        $stmt->execute();
        $result = $stmt->fetchAll();
        $authtime = time();
        $stmt = $db->prepare("UPDATE users SET authtime=:authtime WHERE UserID=:UserID");
        $stmt->bindParam(':authtime', $authtime);
        $stmt->bindParam(':UserID', $UserID);
        $stmt->execute();
        $result = $stmt->fetchAll();
        closeDB($db);
        return $authtoken;
    } catch (PDOException $e) {
        // Print PDOException message
        echo $e->getMessage();
        return null;
    }
}

function validateAuthToken($authtoken) {
    try {
        $db = openDB(DBFILE);
        if ($db == null) {
            return array('displayname' => '', 'UserID' => '', 'valid' => false);
        }
        $stmt = $db->prepare("SELECT * FROM users WHERE authtoken=:authtoken");
        $stmt->bindParam(':authtoken', $authtoken);
        $stmt->execute();
        $result = $stmt->fetchAll();
        $valid = false;
        foreach ($result as $row) {
            if ($authtoken === $row['authtoken']) {
                $authtime = $row['authtime'];
                $currentTime = time();
                $timeDiffInDays = abs($currentTime - $authtime) / (60 * 60 * 24);
                if ($timeDiffInDays < 2) {
                    $valid = true;
                    $displayname = $row['displayname'];
                    $UserID = $row['UserID'];
                }
            }
        }
        if ($valid) {
            $validation = array('displayname' => $displayname, 'UserID' => $UserID, 'valid' => true);
        } else {
            $validation = array('displayname' => '', 'UserID' => '', 'valid' => false);
        }
        closeDB($db);
        return $validation;
    } catch (PDOException $e) {
        // Print PDOException message
        echo $e->getMessage();
        return array('displayname' => '', 'UserID' => '', 'valid' => false);
    }
}

function verifyAccount($username, $password) {
    try {
        $db = openDB(DBFILE);
        if ($db == null) {
            return null;
        }
        $stmt = $db->prepare("SELECT * FROM users WHERE username=:username");
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        $result = $stmt->fetchAll();
        $valid = false;
        $UserID = null;
        foreach ($result as $row) {
            if ($password === $row['password']) {
                $valid = true;
                $UserID = $row['UserID'];
                $displayname = $row['displayname'];
                break;
            }
        }
        if ($valid) {
            $verification = array('UserID' => $UserID, 'displayname' => $displayname, 'valid' => true);
        } else {
            $verification = array('UserID' => '', 'displayname' => '', 'valid' => false);
        }
        closeDB($db);
        return $verification;
    } catch (PDOException $e) {
        // Print PDOException message
        echo $e->getMessage();
        return null;
    }
}

function userExists($UserID) {
    try {
        $db = openDB(DBFILE);
        if ($db == null) {
            return false;
        }
        $stmt = $db->prepare("SELECT * FROM users WHERE UserID=:UserID");
        $stmt->bindParam(':UserID', $UserID);
        $stmt->execute();
        $result = $stmt->fetchAll();
        $numRows = 0;
        foreach ($result as $row) {
            $numRows++;
        }
        //echo json_encode($result['NrRecords']);
        if ($numRows === 0) {
            return false;
        } else {
            return true;
        }
        closeDB($db);
    } catch (PDOException $e) {
        // Print PDOException message
        echo $e->getMessage();
        return false;
    }
}

function createNewLayer($UserID, $type, $description) {
    if (userExists($UserID)) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return null;
            }
            $insert = "INSERT INTO layers (LayerID, UserID, Type, Description) 
            VALUES (:LayerID, :UserID, :Type, :Description)";
            $stmt = $db->prepare($insert);
            // Bind parameters to statement variables
            $LayerID = uniqid();
            $stmt->bindParam(':LayerID', $LayerID);
            $stmt->bindParam(':UserID', $UserID);
            $stmt->bindParam(':Type', $type);
            $stmt->bindParam(':Description', $description);
            $stmt->execute();
            closeDB($db);
            return $LayerID;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return null;
        }
    } else {
        return null;
    }
}

function getUserLayers($UserID) {
    if (userExists($UserID)) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return null;
            }
            $stmt = $db->prepare("SELECT * FROM layers WHERE UserID=:UserID");
            $stmt->bindParam(':UserID', $UserID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            $layers = [];
            foreach ($result as $row) {
                $layer = array('LayerID' => $row['LayerID'], 'ShareID' => $row['ShareID'], 'Type' => $row['Type'], 'Description' => $row['Description']);
                $layers[] = $layer;
            }
            closeDB($db);
            return $layers;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return null;
        }
    } else {
        return null;
    }
}

function getUserIDFromAuthtokenData($authtoken) {
    try {
        $db = openDB(DBFILE);
        if ($db == null) {
            return null;
        }
        $UserID = null;
        $stmt = $db->prepare("SELECT * FROM users WHERE authtoken=:authtoken");
        $stmt->bindParam(':authtoken', $authtoken);
        $stmt->execute();
        $result = $stmt->fetchAll();
        foreach ($result as $row) {
            if ($authtoken === $row['authtoken']) {
                $UserID = $row['UserID'];
            }
        }
        closeDB($db);
        return $UserID;
    } catch (PDOException $e) {
        // Print PDOException message
        echo $e->getMessage();
        return null;
    }
}

function changePassword($authtoken, $oldPassword, $newPassword) {
    try {
        $db = openDB(DBFILE);
        if ($db == null) {
            return false;
        }
        $status = false;
        $stmt = $db->prepare("UPDATE users SET password=:newPassword  WHERE authtoken=:authtoken AND password=:oldPassword");
        $stmt->bindParam(':newPassword', $newPassword);
        $stmt->bindParam(':authtoken', $authtoken);
        $stmt->bindParam(':oldPassword', $oldPassword);
        $stmt->execute();
        $result = $stmt->fetchAll();
        if ($result->rowCount() > 0) {
            $status = true;
        }
        closeDB($db);
        return $status;
    } catch (PDOException $e) {
        // Print PDOException message
        echo $e->getMessage();
        return false;
    }
}

function getUserInfo($UserID) {
    if (userExists($UserID)) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return null;
            }
            $stmt = $db->prepare("SELECT * FROM users WHERE UserID=:UserID");
            $stmt->bindParam(':UserID', $UserID);
            $stmt->execute();
            $result = $stmt->fetchAll();

            foreach ($result as $row) {
                $userInfo = array('DisplayName' => $row['displayname']);
            }
            closeDB($db);
            return $userInfo;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return null;
        }
    } else {
        return null;
    }
}

function getShares($UserID, $newShareID) {
    if (userExists($UserID)) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return null;
            }
            $shareAreadyAdded = false;
            // Retrieve the shares that a user is following
            $stmt = $db->prepare("SELECT * FROM shares WHERE UserID=:UserID");
            $stmt->bindParam(':UserID', $UserID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            $shares = [];
            foreach ($result as $row) {
                if ($row['ShareID'] === $newShareID) {
                    $shareAreadyAdded = true;
                }
                $stmt2 = $db->prepare("SELECT * FROM layers WHERE ShareID=:ShareID");
                $stmt2->bindParam(':ShareID', $row['ShareID']);
                $stmt2->execute();
                $result2 = $stmt2->fetchAll();
                foreach ($result2 as $row2) {
                    $Description = $row2['Description'];
                    $OwnerID = $row2['UserID'];
                    $LayerID = $row2['LayerID'];
                    $layerType = $row2['Type'];
                }
                $OwnerName = getDisplayName($OwnerID);
                if ($layerType === 'userLocation') {
                    $markers = getUserLocationMarker($LayerID);
                } else {
                    $markers = getLayerMarkers($LayerID);
                }
                $shares[] = array('ShareID' => $row['ShareID'], 'Accepted' => $row['Accepted'], 'Description' => $Description, 'OwnerName' => $OwnerName, 'markers' => $markers);
            }
            //echo json_encode($shareAreadyAdded,true);
            if (!$shareAreadyAdded && shareExists($newShareID)) {
                $insert = "INSERT INTO shares (TempID, ShareID, UserID, Accepted)
                    VALUES (:TempID, :ShareID, :UserID, :Accepted)";
                $stmt = $db->prepare($insert);
                //echo 'newShareID: ' . json_encode($newShareID,true) . ', UserID: ' . json_encode($UserID,true);
                $Accepted = 0;
                // Bind parameters to statement variables
                $stmt->bindParam(':TempID', hash('md5', uniqid('', true)));
                $stmt->bindParam(':ShareID', $newShareID);
                $stmt->bindParam(':UserID', $UserID);
                $stmt->bindParam(':Accepted', $Accepted);
                $stmt->execute();
                $stmt2 = $db->prepare("SELECT * FROM layers WHERE ShareID=:ShareID");
                $stmt2->bindParam(':ShareID', $newShareID);
                $stmt2->execute();
                $result2 = $stmt2->fetchAll();
                foreach ($result2 as $row2) {
                    $Description = $row2['Description'];
                    $OwnerID = $row2['UserID'];
                    $LayerID = $row2['LayerID'];
                }
                $OwnerName = getDisplayName($OwnerID);
                $markers = getLayerMarkers($LayerID);
                //echo 'markers: ' . json_encode($markers,true);
                $shares[] = array('ShareID' => $newShareID, 'Accepted' => 0, 'Description' => $Description, 'OwnerName' => $OwnerName, 'markers' => $markers);
            }

            closeDB($db);
            return $shares;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return null;
        }
    } else {
        return null;
    }
}

function removeShare($UserID, $ShareID) {
    if (userExists($UserID)) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return false;
            }
            $stmt = $db->prepare("DELETE FROM shares WHERE ShareID=:ShareID AND UserID=:UserID");
            $stmt->bindParam(':ShareID', $ShareID);
            $stmt->bindParam(':UserID', $UserID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            closeDB($db);
            return true;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return false;
        }
    } else {
        return false;
    }
}

function getAllUserData($UserID, $newShareID) {
    if (userExists($UserID)) {
        $layers = getUserLayers($UserID);  // layers
        $markers = [];
        foreach ($layers as $layer) {
            $layerMarkers = getLayerMarkers($layer['LayerID']);
            $markers[] = $layerMarkers;
        }
        $user = getUserInfo($UserID);  // user
        $shares = getShares($UserID, $newShareID);
        if ($layers !== null && $markers !== null && $user !== null && $shares !== null) {
            return array('user' => $user, 'layers' => $layers, 'markers' => $markers, 'shares' => $shares);
        } else {
            return null;
        }
    } else {
        return null;
    }
}

function getDisplayName($UserID) {
    try {
        $db = openDB(DBFILE);
        if ($db == null) {
            return null;
        }
        $displayname = null;
        $stmt = $db->prepare("SELECT * FROM users WHERE UserID=:UserID");
        $stmt->bindParam(':UserID', $UserID);
        $stmt->execute();
        $result = $stmt->fetchAll();
        foreach ($result as $row) {
            $displayname = $row['displayname'];
        }
        closeDB($db);
        return $displayname;
    } catch (PDOException $e) {
        // Print PDOException message
        echo $e->getMessage();
        return null;
    }
}

function layerExists($LayerID) {
    try {
        $db = openDB(DBFILE);
        if ($db == null) {
            return false;
        }
        $stmt = $db->prepare("SELECT * FROM layers WHERE LayerID=:LayerID");
        $stmt->bindParam(':LayerID', $LayerID);
        $stmt->execute();
        $result = $stmt->fetchAll();
        $numRows = 0;
        foreach ($result as $row) {
            $numRows++;
        }
        closeDB($db);
        //echo json_encode($result['NrRecords']);
        if ($numRows === 0) {
            return false;
        } else {
            return true;
        }
    } catch (PDOException $e) {
        // Print PDOException message
        echo $e->getMessage();
        return false;
    }
}

function getLayerType($LayerID) {
    if (layerExists($LayerID)) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return null;
            }
            $stmt = $db->prepare("SELECT * FROM layers WHERE LayerID=:LayerID");
            $stmt->bindParam(':LayerID', $LayerID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            $layerType = null;
            foreach ($result as $row) {
                $layerType = $row['Type'];
            }
            closeDB($db);
            return $layerType;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return null;
        }
    } else {
        return null;
    }
}

function getUserLocationMarker($LayerID) {
    if (layerExists($LayerID)) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return null;
            }
            $layerType = getLayerType($LayerID);
            $markers = array();
            $stmt = $db->prepare("SELECT * FROM layers WHERE LayerID=:LayerID");
            $stmt->bindParam(':LayerID', $LayerID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            foreach ($result as $row) {
                $ShareID = $row['ShareID'];
                $Description = $row['Description'];
            }
            $MarkerID = uniqid();  // this will change each update, but it's only useful for the JavaScript menu
            $stmt = $db->prepare("SELECT * FROM geoloc WHERE ShareID=:ShareID");
            $stmt->bindParam(':ShareID', $ShareID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            foreach ($result as $row) {
                $marker = array('MarkerID' => $MarkerID, 'LayerID' => $LayerID, 'Type' => 'Dynamic', 'Lat' => $row['Lat'], 'Lon' => $row['Lon'], 'Time' => $row['Time'], 'Description' => $Description);
                $markers = array($marker);
            }
            closeDB($db);
            return $markers;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return null;
        }
    } else {
        return null;
    }
}

function getLayerMarkers($LayerID) {
    //echo 'getMarkers: ' . json_encode($LayerID, true);
    if (layerExists($LayerID)) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return null;
            }
            $layerType = getLayerType($LayerID);
            $markers = array();
            $stmt = $db->prepare("SELECT * FROM markers WHERE LayerID=:LayerID");
            $stmt->bindParam(':LayerID', $LayerID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            foreach ($result as $row) {
                $marker = array('MarkerID' => $row['MarkerID'], 'LayerID' => $LayerID, 'Type' => $row['Type'], 'Lat' => $row['Lat'], 'Lon' => $row['Lon'], 'Time' => $row['Time'], 'Description' => $row['Description']);
                $markers[] = $marker;
            }
            closeDB($db);
            return $markers;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return null;
        }
    } else {
        return null;
    }
}

function saveMarker($markerInfo) {
    if (layerExists($markerInfo['LayerID'])) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return null;
            }
            $insert = "INSERT INTO markers (MarkerID, LayerID, Type, Description, Lat, Lon, Time) 
            VALUES (:MarkerID, :LayerID, :Type, :Description, :Lat, :Lon, :Time)";
            //$insert = "INSERT INTO markers (MarkerID, LayerID, Type, Description, Lat, Lon) 
            //VALUES ($MarkerID, $markerInfo['LayerID'], $markerInfo['Type'], :Description, :Lat, :Lon)";
            $stmt = $db->prepare($insert);
            // Bind parameters to statement variables
            $MarkerID = uniqid();
            $stmt->bindParam(':MarkerID', $MarkerID);
            $stmt->bindParam(':LayerID', $markerInfo['LayerID']);
            $stmt->bindParam(':Lat', $markerInfo['Lat']);
            $stmt->bindParam(':Lon', $markerInfo['Lon']);
            $stmt->bindParam(':Time', time());
            $stmt->bindParam(':Type', $markerInfo['Type']);
            $stmt->bindParam(':Description', $markerInfo['Description']);
            $stmt->execute();
            closeDB($db);
            return $MarkerID;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return null;
        }
    } else {
        return null;
    }
}

function getPasswordHash($password) {
    return hash('sha256', $password);
}

function setShare($authtoken, $ShareID) {
    $validation = validateAuthToken($authtoken);
    if ($validation['valid']) {
        $UserID = $validation['UserID'];
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return null;
            }
            $stmt = $db->prepare("UPDATE layers SET ShareID=:ShareID WHERE UserID=:UserID AND Type=\"userLocation\"");
            $stmt->bindParam(':ShareID', $ShareID);
            $stmt->bindParam(':UserID', $UserID);
            $stmt->execute();
            $result = $stmt->fetchAll();

            closeDB($db);
            return true;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return false;
        }
    } else {
        return false;
    }
}

function updateShare($authtoken, $ShareID, $coords, $time) {
    $validation = validateAuthToken($authtoken);
    if ($validation['valid']) {
        $UserID = $validation['UserID'];
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return false;
            }
            $insert = "INSERT INTO geoloc (UserID, ShareID, Lat, Lon, Time) 
            VALUES (:UserID, :ShareID, :Lat, :Lon, :Time)";
            $stmt = $db->prepare($insert);
            // Bind parameters to statement variables
            $stmt->bindParam(':UserID', $UserID);
            $stmt->bindParam(':ShareID', $ShareID);
            $stmt->bindParam(':Lat', $coords[0]);
            $stmt->bindParam(':Lon', $coords[1]);
            $stmt->bindParam(':Time', $time);
            $stmt->execute();
            closeDB($db);
            return true;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return false;
        }
    } else {
        return false;
    }
}

function getSharedUserLocation($authtoken, $ShareID) {
    $validation = validateAuthToken($authtoken);
    if ($validation['valid']) {
        $locData = array('status' => false);
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return $locData;
            }
            $stmt = $db->prepare("SELECT * FROM geoloc WHERE ShareID=:ShareID");
            $stmt->bindParam(':ShareID', $ShareID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            $numRows = 0;
            foreach ($result as $row) {
                if ($row['ShareID'] === $ShareID) {
                    $locData = array('Lat' => $row['Lat'], 'Lon' => $row['Lon'], 'Time' => $row['Time'], 'status' => true);
                }
                $numRows++;
            }

            closeDB($db);
            return $locData;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return $locData;
        }
    } else {
        return $locData;
    }
}

function deleteMarker($authtoken, $MarkerID) {
    $validation = validateAuthToken($authtoken);
    if ($validation['valid']) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return false;
            }
            $stmt = $db->prepare("DELETE FROM markers WHERE MarkerID=:MarkerID");
            $stmt->bindParam(':MarkerID', $MarkerID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            closeDB($db);
            return true;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return false;
        }
    } else {
        return false;
    }
}

/*
 * Toggle the state of a layer share, adding a new ShareID if it is being shared
 * and deleting the ShareID if the share is being revoked.
 */

function shareLayer($UserID, $LayerID, $shareState) {
    if (userExists($UserID)) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return false;
            }
            $ShareID = uniqid();
            $oldShareID = getShareIDFromLayerID($LayerID);
            if ($shareState === 1) {
                $stmt = $db->prepare("UPDATE layers SET ShareID=:ShareID WHERE LayerID=:LayerID");
                $stmt->bindParam(':ShareID', $ShareID);
                $stmt->bindParam(':LayerID', $LayerID);
                $stmt->execute();
                $result = $stmt->fetchAll();
            } else {
                // Remove all records in the shares table with the old ShareID
                $stmt = $db->prepare("DELETE FROM shares WHERE ShareID=:oldShareID");
                $stmt->bindParam(':oldShareID', $oldShareID);
                $stmt->execute();
                $result = $stmt->fetchAll();
                // Remove the ShareID from the layers table so we know it is not shared
                $stmt = $db->prepare("UPDATE layers SET ShareID=null WHERE LayerID=:LayerID");
                $stmt->bindParam(':LayerID', $LayerID);
                $stmt->execute();
                $result = $stmt->fetchAll();
            }
            closeDB($db);
            return true;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return false;
        }
    } else {
        return false;
    }
}

function deleteLayer($authtoken, $LayerID) {
    $validation = validateAuthToken($authtoken);
    if ($validation['valid']) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return false;
            }
            $stmt = $db->prepare("DELETE FROM layers WHERE LayerID=:LayerID");
            $stmt->bindParam(':LayerID', $LayerID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            $stmt = $db->prepare("DELETE FROM markers WHERE LayerID=:LayerID");
            $stmt->bindParam(':LayerID', $LayerID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            closeDB($db);
            return true;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return false;
        }
    } else {
        return false;
    }
}

function shareExists($ShareID) {
    try {
        $db = openDB(DBFILE);
        if ($db == null) {
            return false;
        }
        $stmt = $db->prepare("SELECT * FROM layers WHERE ShareID=:ShareID");
        $stmt->bindParam(':ShareID', $ShareID);
        $stmt->execute();
        $result = $stmt->fetchAll();
        $numRows = 0;
        foreach ($result as $row) {
            $numRows++;
        }
        //echo json_encode($result['NrRecords']);
        if ($numRows === 0) {
            return false;
        } else {
            return true;
        }
        closeDB($db);
    } catch (PDOException $e) {
        // Print PDOException message
        echo $e->getMessage();
        return false;
    }
}

function addUnacceptedShare($ShareID, $TempID) {
    if (shareExists($ShareID)) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return false;
            }
            $insert = "INSERT INTO shares (ShareID, TempID, Accepted)
                    VALUES (:ShareID, :TempID, :Accepted)";
            $stmt = $db->prepare($insert);
            $Accepted = 0;
            // Bind parameters to statement variables
            $stmt->bindParam(':ShareID', $ShareID);
            $stmt->bindParam(':TempID', $TempID);
            $stmt->bindParam(':Accepted', $Accepted);
            $stmt->execute();
            closeDB($db);
            return true;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return false;
        }
    } else {
        return false;
    }
}

function updateShareAcceptance($UserID, $shareData) {
    if (userExists($UserID)) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return false;
            }
            foreach ($shareData as $shareUpdate) {
                $ShareID = $shareUpdate['ShareID'];
                $acceptance = $shareUpdate['Accepted'];
                $stmt = $db->prepare("UPDATE shares SET Accepted=:Accepted WHERE ShareID=:ShareID AND UserID=:UserID");                
                $stmt->bindParam(':UserID', $UserID);
                $stmt->bindParam(':ShareID', $ShareID);
                $stmt->bindParam(':Accepted', $acceptance);
                $stmt->execute();
                $result = $stmt->fetchAll();
            }
            $stmt = $db->prepare("DELETE FROM shares WHERE Accepted=2 AND UserID=:UserID");
            $stmt->bindParam(':UserID', $UserID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            closeDB($db);
            return true;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return false;
        }
    } else {
        return false;
    }
}

function getShareIDFromLayerID($LayerID) {
    if (layerExists($LayerID)) {
        try {
            $db = openDB(DBFILE);
            if ($db == null) {
                return null;
            }
            $stmt = $db->prepare("SELECT * FROM layers WHERE LayerID=:LayerID");
            $stmt->bindParam(':LayerID', $LayerID);
            $stmt->execute();
            $result = $stmt->fetchAll();
            foreach ($result as $row) {
                $ShareID = $row['ShareID'];
            }
            closeDB($db);
            return $ShareID;
        } catch (PDOException $e) {
            // Print PDOException message
            echo $e->getMessage();
            return null;
        }
    } else {
        return null;
    }
}

?>
