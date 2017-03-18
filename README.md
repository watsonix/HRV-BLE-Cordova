# HRV-BLE-Cordova

Cross platform HRV calcuation. Physiological (RRI) and subjective data logging to server via HTTP Post.

Connects to a peripherial providing the [Heart Rate Service](http://goo.gl/wKH3X7).

Works with iOS or Android 4.3+.

## Basic instructions

    $ cordova platform add android
    $ cordova plugin add cordova-plugin-ble-central
    $ cordova plugin add cordova-plugin-vibration
    $ cordova plugin add cordova-plugin-whitelist
    $ cordova run android

## For debugging in browser do:

    $ cordova platform add browser
    $ cordova plugin add cordova-plugin-device

The cordova-plugin-device plugin will allow for checking whether the app is being run in browser (debugging) mode or on an actual device. (TODO: we may not need this anymore if we use XMLHttpRequest for both browser and device)

Then to run:

    $ cordova run browser


## Other info

Branched from [this cordova BLE example](https://github.com/don/cordova-plugin-ble-central)