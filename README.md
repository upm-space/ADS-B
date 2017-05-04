# Awesome ADS-B Flight Plotting

This JavaScript project aims to decode the ADS-B signal from nearby 
airplanes using a RTL-SDR software and a DVB-T TV tuner dongle based 
on the RTL2832U chipset and display it on a map.

The project has two scripts: 

* **ADS-B Decoder.** The script receives the signal from the RTL1090 software 
and gets the data from the it. Then, the signal is decoded and saved it 
in a vector to feed the other script.

* **Flight Plotting.** It gets the aircraft flight data previously stored 
and shows all the parameters and the path of the airplanes on a map.

## Introduction

Automatic Dependant Surveillance - Broadcast (ADS-B) is a surveillance 
technology in which the aircraft broadcasts different flight parameters 
so it can be tracked by other users. The signal is transmitted at 1090 MHz, 
essentially by a modified Mode S transponder. 

The operation frequency can be tracked by anyone with a proper receiver, 
for example, with a regular DVT-T TV dongle with the chipset RTL2832U.

The information provided by the aircraft includes: ICAO Address, Call Sign, 
Altitude, Ground Speed, Vertical Speed, Track and Position. 

## How to use 

The first step is opening the RTL1090 software and starting it to collect 
the data from nearby aircraft.

Then, the port used by the USB dongle should be set in line 8 of the ADS-B
Decoder script.

    var port = 31011; 

Run the program:

    ./ADS-B Decoder
    
## Credits
The sources of the project are the [RTL1090 Software](http://rtl1090.com/) 
and some code from [Node ADS-B](https://github.com/grantmd/node-adsb).

Awesome ADS-B Flight Plotting was written by Andres Perillo, Angel Martinez
and Sergio Fernández for the Technical University of Madrid (UPM).