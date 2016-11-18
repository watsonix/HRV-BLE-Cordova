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

// See BLE heart rate service http://goo.gl/wKH3X7
var heartRate = {
    service: '180d',
    measurement: '2a37'
};

var intervalID;

// How often to send data to the server, in ms
const SYNC_INTERVAL = 2000;
// The server URL
const SYNC_URL = 'http://35.164.69.103:5000/heartbeats';

var app = {
    initialize: function() {
        this.bindEvents();
        this.data = ['hello world'];  // Whatever data you want to send to the server
        intervalID = window.setInterval(this.sendData.bind(this), SYNC_INTERVAL)
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        //document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() {
        app.scan();
    },
    scan: function() {
        app.status("Scanning for Heart Rate Monitor");

        var foundHeartRateMonitor = false;

        function onScan(peripheral) {
            // this is demo code, assume there is only one heart rate monitor
            console.log("Found " + JSON.stringify(peripheral));
            foundHeartRateMonitor = true;

            ble.connect(peripheral.id, app.onConnect, app.onDisconnect);
        }

        function scanFailure(reason) {
            alert("BLE Scan Failed");
        }

        ble.scan([heartRate.service], 5, onScan, scanFailure);

        setTimeout(function() {
            if (!foundHeartRateMonitor) {
                app.status("Did not find a heart rate monitor.");
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
    },
    onData: function(buffer) {
        // assuming heart rate measurement is Uint8 format, real code should check the flags
        // See the characteristic specs http://goo.gl/N7S5ZS
        var data = new Uint8Array(buffer);
        beatsPerMinute.innerHTML = data[1];
        this.data.push(data[1])
    },
    sendData: function() {
        var xhr =  new XMLHttpRequest();
        var params = 'data=' + JSON.stringify(this.data);
        xhr.open("POST", SYNC_URL);
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(params);
    },
    onError: function(reason) {
        alert("There was an error " + reason);
    },
    status: function(message) {
        console.log(message);
        statusDiv.innerHTML = message;
    },
    standardDeviation: function(data) {
        const avg = average(data)
        const squareDiffs = data.map(function (value) {
            var diff = value - avg
            return diff * diff
        })
        const avgSquareDiff = average(squareDiffs)
        return Math.sqrt(avgSquareDiff)
    }
};

app.initialize();
