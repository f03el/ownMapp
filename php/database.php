<?php

date_default_timezone_set('America/New_York');

/**
 * Description of database
 *
 * @author andrew
 */
class database {
    
    public $maps = array();
        public $users = array();
        public $markers = array();
        public $mapDBFilename = "";
        public $userDBFilename = "";
        public $markerDBFilename = "";

    /**
    *  Constructor
    *  @param string $mapDBFilename
    *  @param string $userDBFilename
    *  @param string $markerDBFilename
    *  @return void
    */
     function __construct($mapDBFilename, $userDBFilename, $markerDBFilename, $sharesDBFilename) {
             $this->mapDBFilename = $mapDBFilename;
             $this->userDBFilename = $userDBFilename;
             $this->markerDBFilename = $markerDBFilename;
             $this->sharesDBFilename = $sharesDBFilename;
             $this->maps = json_decode(file_get_contents($mapDBFilename),true);
             $this->users = json_decode(file_get_contents($userDBFilename),true);
             $this->markers = json_decode(file_get_contents($markerDBFilename),true);
             $this->shares = json_decode(file_get_contents($sharesDBFilename),true);
     }
     
     public function shareExists($sid) {
        foreach ($this->shares as $key => $share) {
            if ($share['sid'] == $sid) {
                return true;
            }				
        }
        return false;
     }
     
     public function createShare($data) {
        // Search users for existing usernames
        if ($this->shareExists($data['sid'])) {
            return false;
        }
        // Create new entry and populate with the input owner
        // and description info
        $newShareJSONTemplate = '{
                                "sid": "",
                                "time": "",
                                "coords": {
                                    "lat": 0,
                                    "lon": 0
                                },
                                "curLocMkr": "",
                                "markers": []
                        }';
        $newShare = json_decode($newShareJSONTemplate, true);
        $newShare['sid'] = $data['sid'];
        $newShare['time'] = $data['time'];
        $this->shares[] = $newShare;
        $this->saveSharesToFile();
        return true;        
    }
    
    public function updateShare($data) {
        if (!($this->shareExists($data['sid']))) {
            return false;
        }
        // Update share with new time and location
        foreach ($this->shares as $key => &$share) {
            if ($share['sid'] === $data['sid']) {
                $share['time'] = $data['time'];
                $share['coords'] = $data['coords'];
                $share['curLocMkr'] = $data['curLocMkr'];
                $share['markers'] = $data['markers'];
                $this->saveSharesToFile();
                return true;
            }
        }
        return false;        
    }
    
    public function getSharedCoordinates($sid) {
        if (!($this->shareExists($sid))) {
            return false;
        }
        foreach ($this->shares as $key => &$share) {
            if ($share['sid'] === $sid) {
                return $share['coords'];
            }
        }
        return false;        
    }
    
    public function getSharedMarkers($sid) {
        if (!($this->shareExists($sid))) {
            return false;
        }
        foreach ($this->shares as $key => &$share) {
            if ($share['sid'] === $sid) {
                $returnData['markers'] = $share['markers'];
                $returnData['curLocMkr'] = $share['curLocMkr'];
                $returnData['coords'] = $share['coords'];
                return $returnData;
            }
        }
        return false;        
    }
    
    /**
    *  Saves the current $this->shares database in memory to the shares
    *  database file
    *  @return void
    */ 				
    public function saveSharesToFile() {
        // Save the shares database to the database file
        $fh = fopen($this->sharesDBFilename, 'w') or die("Error opening output file");
        fwrite($fh, json_encode($this->shares));
        fclose($fh);
    }
}

?>