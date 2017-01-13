// (c) 2015 Don Coleman
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global ble, statusDiv, beatsPerMinute */
/* jshint browser: true , devel: true*/

//misc settings
const RRI_MAX = 20;
const API_SERVER = "35.167.145.159"

// See BLE heart rate service http://goo.gl/wKH3X7
var heartRate = {
    service: '180d',
    measurement: '2a37'
};

var rrIntervals = [];

var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.getElementById('feeling')
          .addEventListener('click', this.clickFeeling, false);
    },

    clickFeeling: function(event) {
        var value = event.target.dataset.value
        document.getElementById('feelingValue').innerHTML = value
        serverPost()
    },

    onDeviceReady: function() {
        //app.scan(); //comment out without device
        serverPostHeart()
    },
    scan: function(scanTry = 0, extraText = "") {
        var foundHeartRateMonitor = false;

        app.status(extraText + " Scanning for Heart Rate Monitor. Try number " + scanTry);
        ble.scan([heartRate.service], 5, onScan, scanFailure);

        function onScan(peripheral) {
            // this is demo code, assume there is only one heart rate monitor
            console.log("Found " + JSON.stringify(peripheral));
            foundHeartRateMonitor = true;

            ble.connect(peripheral.id, app.onConnect, app.onDisconnect);
        }

        function scanFailure(reason) {
            alert("BLE Scan Failed");
        }

        setTimeout(function() {
            if (!foundHeartRateMonitor) {
                app.status("Did not find a heart rate monitor.");
                app.scan(++scanTry,"Did not find a heart rate monitor.")
            }
        }, 5000);
    },
    onConnect: function(peripheral) {
        app.status("Connected to " + peripheral.id);
        ble.startNotification(peripheral.id, heartRate.service, heartRate.measurement, app.onData, app.onError);
    },
    onDisconnect: function(reason) {
        alert("Disconnected " + reason);
        beatsPerMinute.innerHTML = "...";
        app.status("Disconnected");
        setTimeout(app.scan,3000)
    },
    onData: function(buffer) {
        // var data = new Uint8Array(buffer);
        measurement = app.parseHeartRateMeasurement(buffer)
        beatsPerMinute.innerHTML = measurement.heartRate

        //HRV calculation
        rrIntervals.push.apply(rrIntervals, measurement.rrIntervals) //add to RRI array
        while (rrIntervals.length > RRI_MAX) { rrIntervals.shift() } //remove old elements from RRI array
        std = app.standardDeviation(rrIntervals)
        hrvSDRR.innerHTML = std
        //**** last DEV:
        if (std > 100) {
            navigator.vibrate(3000);
        } //see https://github.com/katzer/cordova-plugin-local-notifications for next level

        //server post
        serverPostHeart()

    },
    onError: function(reason) {
        alert("There was an error " + reason);
    },
    status: function(message) {
        console.log(message);
        statusDiv.innerHTML = message;
    },
    parseHeartRateMeasurement: function (value) {         // See the characteristic specs http://goo.gl/N7S5ZS
        value = value.buffer ? value : new DataView(value) // check if DataView already. if not convert it
        let flags = value.getUint8(0)
        let rate16Bits = flags & 0x1
        let result = {}
        let index = 1
        if (rate16Bits) {
        result.heartRate = value.getUint16(index, /* littleEndian= */true)
        index += 2
        } else {
        result.heartRate = value.getUint8(index)
        index += 1
        }
        let contactDetected = flags & 0x2
        let contactSensorPresent = flags & 0x4
        if (contactSensorPresent) {
        result.contactDetected = !!contactDetected
        }
        let energyPresent = flags & 0x8
        if (energyPresent) {
        result.energyExpended = value.getUint16(index, /* littleEndian= */true)
        index += 2
        }
        let rrIntervalPresent = flags & 0x10
        if (rrIntervalPresent) {
        let rrIntervals = []
        for (; index + 1 < value.byteLength; index += 2) {
          rrIntervals.push(value.getUint16(index, /* littleEndian= */true))
        }
        result.rrIntervals = rrIntervals
        }
        return result
    },
    standardDeviation: function(data) {
        const avg = average(data)
        const squareDiffs = data.map(function (value) {
            var diff = value - avg
            return diff * diff
        })
        const avgSquareDiff = average(squareDiffs)
        return Math.sqrt(avgSquareDiff)
    },
};

function average (data) {
    var sum = data.reduce(function (sum, value) {
        return sum + value
    }, 0)
    return sum / data.length
};

function serverPostHeart (intervals){
//send to server data on latest RRIs
    payload = {
        start: "2016-09-13T13:09:28Z",
        end: "2016-09-13T13:10:28Z",
        beats: [1473772168098, 1473772168848, 'foo'] 
    }

    serverPost(payload)
}

function serverPostExperience (type,value){
//send to server data on type and value of subjective report
//how activated are you calm ... activated
//how pleasant do you feel. very unpleasant ... very pleasant

    payload = {
        start: "2016-09-13T13:09:28Z",
        end: "2016-09-13T13:10:28Z",
        beats: [1473772168098, 1473772168848, 'foo'] 
    }

    serverPost(payload)
}

function serverPost (user,type,payload) {
    //debug via browser, don't use cordovaHTTP
    if (device.platform == "browser") { 
        var request = new XMLHttpRequest();   // new HttpRequest instance 
        request.open("POST", "http://"+API_SERVER+":5000/heartbeats", true);
        //request.setRequestHeader("Content-Type", "application/json");
        request.onreadystatechange = function () {
            // do something to response
            console.log('readystate:')
            console.log(this.readyState)
            console.log('status:')
            console.log(this.status)
            console.log('response:');
            console.log(this.responseText);
        }
        request.send(JSON.stringify(payload));
        return
    }

    console.log("trying cordovaHTTP post>>>>>>>>>>");
    cordovaHTTP.post(API_SERVER+":5000/heartbeats", payload,
        {}, 
        function(response) {
            // prints 200
            console.log(response.status);
            try {
                response.data = JSON.parse(response.data);
                // prints test
                console.log("test***");
                console.log(response.data.message);
            } catch(e) {
                console.log("test***");
                console.error("JSON parsing error");
            }
        }, 
        function(response) {
            // prints 403
            console.log("test***");
            console.log(response.status);

            //prints Permission denied 
            console.log(response.error);
        });
}



app.initialize();
