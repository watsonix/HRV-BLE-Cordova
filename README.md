# HRV-BLE-Cordova

Cross platform HRV calcuation with physiological and subjective data logging to server

Connects to a peripherial providing the [Heart Rate Service](http://goo.gl/wKH3X7).

Works with iOS or Android 4.3+.

## Basic instructions

    $ cordova platform add android
    $ cordova plugin add cordova-plugin-ble-central
    $ cordova plugin add cordova-plugin-vibration
    $ cordova plugin add cordova-plugin-http
    $ cordova run

## For debugging in browser do:

    $ cordova platform add browser
    $ cordova plugin add cordova-plugin-device

and add the ["Allow-Control-Allow-Origin" extension](https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?hl=en-US) to Chrome, which allows the browser to POST successfully. 

The cordova-plugin-device plugin will allow for checking whether the app is being run in browser (debugging) mode or on an actual device.

Then to run:

    $ cordova run browser


## Other info

Branched from [this cordova BLE example](https://github.com/don/cordova-plugin-ble-central)