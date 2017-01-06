# HRV-BLE-Cordova

Cross platform HRV calcuation with physiological and subjective data logging to server

Connects to a peripherial providing the [Heart Rate Service](http://goo.gl/wKH3X7).

Works with iOS or Android 4.3+.

    $ cordova platform add android
    $ cordova plugin add cordova-plugin-ble-central
    $ cordova plugin add cordova-plugin-vibration
    $ cordova plugin add cordova-plugin-http
    $ cordova run

For debugging in browser do:
    $ cordova platform add browser
    $ cordova plugin add cordova-plugin-device

Branched from [this cordova BLE example](https://github.com/don/cordova-plugin-ble-central)