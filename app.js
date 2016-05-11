var express = require('express');
var io = require('socket.io-client');
var Gpio = require('onoff').Gpio;
var garageInterval;
var portIsRunning = false;
var usonic = require('r-pi-usonic');

var site = process.argv[2] || 'localhost:3000';
var client = io.connect(site);
var isBusyBlinking = false;
var turnOff;
var reportDistance;

var blink = function (time) {
    var led = new Gpio(23, 'out');
    led.writeSync(1);
    isBusyBlinking = true;

    if (turnOff) {
        clearTimeout(turnOff);
    }

    turnOff = setTimeout(function () {
        led.writeSync(0);
        led.unexport();
        isBusyBlinking = false;
    }, time);
}

var handleCommand = function (command) {
    command = command.toLowerCase().split(' ');

    switch (command[0]) {
        case 'status':
            client.emit('pi', [
                'Tar ein is i vårsola',
                'Tek meg eit stev',
                'Jobbar på i garasjen',
                'Ventar på å lukke eller opne porten',
                'Har det Ok',
                'Tek det kuli',
                'Alltid moro i garasjen',
                'Anbefalar ein sykkeltur!',
                'Litt kaldt her idag,',
                'No er våren i kjømda!'][Math.floor(Math.random() * 10)]);
            break;
        case 'blink':
            var dur = command[1] || 1000;
            if (!isBusyBlinking) {
                blink(dur);
                client.emit('pi', 'Ok, opnar i ' + dur + ' millisekund');
            }
            break;
        default:
            client.emit('pi', 'Eg fortstod ikkje meldinga di: "' + command + '". Prøv <status> eller <blink>');
            break;
    }
}

usonic.init(function (error) {
    if (error) {
        console.log('fail!', error);
    } else {
        var sensor = usonic.createSensor(21, 17, 450);

        client.on('connect', function () {
            console.log('connected!');
            client.emit('pi', 'Hei.');

            if (reportDistance) {
                clearInterval(reportDistance);
            }
            
            reportDistance = setInterval(function () {
                var distance = sensor();
                client.emit('distance-message', distance);
            }, 5000);
        });

        client.on('command', handleCommand)
    }
});

console.log('trying to connect to ' + site);