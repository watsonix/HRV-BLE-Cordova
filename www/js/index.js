// 2017 Watson Xi and SAAT Team

/* global ble, statusDiv, beatsPerMinute */
/* jshint browser: true , devel: true*/


//misc settings
const RRI_MAX = 20; //history size to take HRV from
const API_SERVER = "35.167.145.159" //production server
//const API_SERVER = "0.0.0.0" //dev host machine via hotspot
//const API_SERVER = "localhost" //dev host machine when testing with browser

/* User select stuff */
let USERS = ["Watson", "Daniel", "Jean", "Kaan", "Logan", "Efrem"];

let USER_ID = "",
    userSelector = document.getElementById("selectUser");
    connect_indicator = document.getElementById("connection");

for(var i = 0; i < USERS.length; i++) {
    let opt = USERS[i];
    let el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    userSelector.appendChild(el);
}

userSelector.onchange = function(){
    USER_ID = userSelector.options[userSelector.selectedIndex].value;
    console.log(`USER_ID=${USER_ID}`);
}


// See BLE heart rate service http://goo.gl/wKH3X7
var heartRate = {
    service: '180d',
    measurement: '2a37'
};

var rrIntervals = [];
const INTERVAL = 30;


function serverPostHeart (timestamp,values){
//send to server data on latest RRIs
    console.log(values)
    if (typeof timestamp === "undefined") { //no args, run with default value (for debugging)
        timestamp = currentTimeISOString()
        payload = {
            mobile_time: timestamp,
            batch_index: 0,
            value: 666,
        }
        serverPost("rr_intervals",payload)
    } else { //package up values in correct format (see https://github.com/danielfennelly/SAAT-API/wiki)
        for (i = 0; i + 1 < values.length; i += 1) {
            nextItem = {
                mobile_time: timestamp,
                batch_index: i, // Collecting measurements returns a batch of several RRIntervals, and this is the index within a single batch.
                value: values[i], // RRI in msec
            }
            // payload.push(nextItem) //TODO: eventually package up and post all together
            serverPost("rr_intervals",nextItem)
        }
    }

};

function serverPostExperience (type,timestamp,value){
//send to server data on type and value of subjective report
//how activated are you calm ... activated
//how pleasant do you feel. very unpleasant ... very pleasant

    if (typeof type === "undefined") { //no args, run with default value (for debugging)
        timestamp = currentTimeISOString()
        type = "activation"
        payload = {
            mobile_time: timestamp,
            value: 4
        }
    } else if (type === "activation" || type === "pleasantness") { //package up values in correct format (see https://github.com/danielfennelly/SAAT-API/wiki)
        payload = {
            mobile_time: timestamp,
            value: value,
        }
    } else {
        throw new Error("unknown type: " + type)
    }

    serverPost(type,payload)
};

function serverPost (type,payload) {

    post_url = `https://${API_SERVER}:443/users/${USER_ID.toLowerCase()}/measurements/${type}`
    console.log(post_url )
    // post_url = "http://"+API_SERVER+":5000/test/foo" //basic test. should return {'test': 'success'}

    //TODO: remove conditional logic and take out cordovaHTTP below if XMLHttpRequest seems to work on
    //all devices with cordova-plugin-whitelist installed. do we care much about SSL pinning?
    if (true) { //(device.platform == "browser") {
        var request = new XMLHttpRequest();   // new HttpRequest instance
        request.open("POST", post_url, true);
        request.setRequestHeader("Content-Type", 'application/json; charset=utf-8');
        request.onreadystatechange = function () {
            // do something to response
            console.log('readystate:')
            console.log(this.readyState)
            console.log('status:')
            console.log(this.status)
            console.log('response:');
            console.log(this.responseText);
        }
        console.log(">>>>>>>>>>sending JSON paylaod via XMLHR: "+JSON.stringify(payload));
        console.log("URL: "+post_url)
        request.send(JSON.stringify(payload));
        return
    }

    //TODO: probably take this all out vvvvvv
    console.log("trying cordovaHTTP post>>>>>>>>>>");
    console.log("URL: "+post_url)
    console.log("payload: "+JSON.stringify(payload))
    cordovaHTTP.post(post_url, payload, {},
        function(response) {
            // prints 200
            console.log(response.status);
            try {
                response.data = JSON.parse(response.data);
                // prints test
                console.log("success!");
                console.log(response.data.message);
            } catch(e) {
                console.log("parse error");
                console.error("JSON parsing error");
            }
        },
        function(response) {
            // prints 403
            console.log("post error!");
            console.log(response.status);

            //prints Permission denied
            console.log(response.error);
        });
};

function add (a, b) {
    return a + b
};

function handleHeartRateMeasurement (heartRateMeasurement) {
    heartRateMeasurement.addEventListener('characteristicvaluechanged', event => {
        let heartRateMeasurement = heartRateSensor.parseHeartRate(event.target.value);
        let heartRateMeasurementVal = heartRateMeasurement.heartRate
        beatsPerMinute.innerHTML = heartRateMeasurementVal;
        rrIntervals.push(heartRateMeasurementVal)
        if (rrIntervals.length > INTERVAL) {
            rrIntervals.shift()
            hrvSDRR.innerHTML = ((60000 * rrIntervals.length) / rrIntervals.reduce(add, 0)).toFixed(2) ;
        };

        serverPostHeart(currentTimeISOString(), heartRateMeasurement.rrIntervals)

    });
};


document.getElementById("connect-device").addEventListener("click", function () {
    if (!USER_ID) {
        return;
    }
    console.log("Hello world!");
    connect_indicator.innerHTML = `${USER_ID} connected`;
    userSelector.style.visibility = 'hidden';

    heartRateSensor.connect()
                   .then(() => heartRateSensor.startNotificationsHeartRateMeasurement().then(handleHeartRateMeasurement))
});


document.getElementById("disconnect-device").addEventListener("click", function () {
    console.log("Goodbye world!")
    connect_indicator.innerHTML = ``;
    heartRateSensor.disconnect()
    userSelector.style.visibility = 'visible';
});


var app = {
    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.getElementById('pleasantness').addEventListener('click', this.clickPleasantness, false);
        document.getElementById('activation').addEventListener('click', this.clickActivation, false);
    },

    clickPleasantness: function(event) {
        var value = event.target.dataset.value
        document.getElementById('pValue').innerHTML = value //show in interface
        timestamp = currentTimeISOString()
        serverPostExperience('pleasantness',timestamp,value)
    },

    clickActivation: function(event) {
        var value = event.target.dataset.value
        document.getElementById('aValue').innerHTML = value //show in interface
        timestamp = currentTimeISOString()
        serverPostExperience('activation',timestamp,value)
    },

    onDeviceReady: function() {
        app.scan(); //comment out without device
        // serverPostHeart() //sending without argument is a test mode
    },
    scan: function(scanTry = 0, extraText = "") {
        var foundHeartRateMonitor = false;

        app.status(extraText + " Scanning for Heart Rate Monitor. Try number " + scanTry);
        //ble.scan([heartRate.service], 5, onScan, scanFailure);

        // function onScan(peripheral) {
        //     // this is demo code, assume there is only one heart rate monitor
        //     console.log("Found " + JSON.stringify(peripheral));
        //     foundHeartRateMonitor = true;

        //     ble.connect(peripheral.id, app.onConnect, app.onDisconnect);
        // }

        // function scanFailure(reason) {
        //     alert("BLE Scan Failed");
        // }

        // setTimeout(function() {
        //     if (!foundHeartRateMonitor) {
        //         app.status("Did not find a heart rate monitor.");
        //         app.scan(++scanTry,"Did not find a heart rate monitor.")
        //     }
        // }, 5000);
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
        timestamp = currentTimeISOString()
        measurement = app.parseHeartRateMeasurement(buffer)

        //TODO: (low priority) getting complaints when device is disconnected from body but still communicating
        //with mobile. this chunk is meant to debug / deal, but doesn't yet.
        if (measurement.rrIntervals.length === 0) {
            console.log('no RR intervals ! >>>>')
            return
        } //skip the rest if theres actually no data
        console.log("measurement.rrIntervals.length " + measurement.rrIntervals.length.toString())

        beatsPerMinute.innerHTML = measurement.heartRate

        //HRV calculation
        rrIntervals.push.apply(rrIntervals, measurement.rrIntervals) //add to RRI array
        while (rrIntervals.length > RRI_MAX) { rrIntervals.shift() } //remove old elements from RRI array
        std = app.standardDeviation(rrIntervals)
        hrvSDRR.innerHTML = std
        if (std > 100) {
            navigator.vibrate(3000);
        } //see https://github.com/katzer/cordova-plugin-local-notifications for next level

        //server post the latest intervals with the timestamp received
        serverPostHeart(timestamp,measurement.rrIntervals)

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
        console.log('new value received: '+ flags.toString())
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

function currentTimeISOString() {
    return new Date().toISOString()
};


