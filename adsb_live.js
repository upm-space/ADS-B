var net = require('net');

// Constantes
var MODES_LONG_MSG_BITS = 112;
var MODES_SHORT_MSG_BITS = 56;


//##################################
//########### CONEXIONES ###########
//##################################

// Configuración de la coonexión de acuerdo al RTL1090
var host = '127.0.0.1';
var port = 31011;

// Se conecta al puerto TCP especificado anteriormente
var client = net.connect({host: host, port: port}, function(){
    console.log('client connected');
});

// Mientras esté establecida la conexión...
client.on('data', function(data){
    var data2 = [];

    // Coge solo la parte que interesa de lo que se recibe del RTL1090, a partir del byte 9
    for (var j=9; j<data.length; j++){
        data2.push(data[j]);
    }
    //console.log("DATOS RAW DEC: " + data2);

    // Llama a la función que decodifica el paquete
    decoder(data2);
});

// Cuando se desconecta el cliente...
client.on('end', function(){
    console.log('client disconnected');
});

// Error de conexión
client.on('error', function(){
    console.log('connection error');
});


//##################################
//######### DECODIFICACIÓN #########
//##################################

function decoder(paquetes) {
    // Tamaño del paquete que se va a decodificar
    var longitud_mensaje = paquetes.length;
    //console.log("LONGITUD: " + longitud_mensaje);

    // Guarda los valores en la matriz byte[]
    var bytes = [];

    for (var i = 0; i < longitud_mensaje; i++) {
        bytes.push(paquetes[i]);
    }

    // Variables
    var downlink_format_decode = "";
    var capability_decode = "";
    var icao_address = [];
    var icao_address_decode = "";
    var tipo_mensaje = "";
    var flight_status_decode = "";
    var callsign = "";
    var flight_decoder = "";
    var latitud_raw = "";
    var longitud_raw = "";
    var direccion_este_oeste = "";
    var velocidad_este_oeste = "";
    var direccion_norte_sur = "";
    var velocidad_norte_sur = "";
    var fuente_velocidad_vertical = "";
    var signo_velocidad_vertical = "";
    var velocidad_vertical = "";

    var tipo_aeronave = 0;
    var heading = 0;
    var velocidad = 0;
    var latitud_decode = 0;
    var longitud_decode = 0;
    var longitud_ref = 0;
    var latitud_ref = 0;
    var dLat = 0;
    var dLon = 0;

    var heading_is_valid = false;


    // Tipo de mensaje: Está siempre, 5 primeros bits del primer byte
    downlink_format = bytes[0] >> 3;

    switch (downlink_format) {
        case 0:
            downlink_format_decode = "TIPO DE MENSAJE: Short Air-Air Surveillance";
            break;
        case 20:
            ((downlink_format == 4) ? "Surveillance" : "Comm-B") + ", Altitude Reply";
            downlink_format_decode = "Mode S Enhanced Surveillance";
            break;
        case 21:
            bits = MODES_LONG_MSG_BITS;
            ((downlink_format == 5) ? "Surveillance" : "Comm-B") + ", Identity Reply";
            downlink_format_decode = "Mode S Enhanced Surveillance";
            break;

        case 11:
            downlink_format_decode = "All Call Reply";
            break;

        case 17:
            downlink_format_decode = "ADS-B message";
            break;

        default:
            downlink_format_decode = "Unknown type";
            bits = MODES_SHORT_MSG_BITS;
            break;
    }
    //console.log("TIPO DE MENSAJE: " + downlink_format_decode);


    // Responder capabilities, always present
    // Últimos 3 bits del primer byte
    /*capability = bytes[0] & 7;

    // Convert responder capabilities
    switch (capability) {
        case 0:
            capability_decode = "Level 1 (Surveillance Only)";
            break;
        case 1:
            capability_decode = "Level 2 (DF0,4,5,11)";
            break;
        case 2:
            capability_decode = "Level 3 (DF0,4,5,11,20,21)";
            break;
        case 3:
            capability_decode = "Level 4 (DF0,4,5,11,20,21,24)";
            break;
        case 4:
            capability_decode = "Level 2+3+4 (DF0,4,5,11,20,21,24,code7 - is on ground)";
            break;
        case 5:
            capability_decode = "Level 2+3+4 (DF0,4,5,11,20,21,24,code7 - is on airborne)";
            break;
        case 6:
            capability_decode = "Level 2+3+4 (DF0,4,5,11,20,21,24,code7)";
            break;
        case 7:
            capability_decode = "Level 7 ???";
            break;
        default:
            capability_decode = "Unknown CA: ";
            break;
    }
*/


    // Para ADSB
    if (downlink_format == 17) {
        // Dirección ICAO, siempre está
        icao_address[0] = bytes[1].toString(16);
        icao_address[1] = bytes[2].toString(16);
        icao_address[2] = bytes[3].toString(16);

        icao_address_decode =  icao_address[0] + "" + icao_address[1] + "" + icao_address[2];

        console.log("DIRECCIÓN OACI: " + icao_address_decode);


        type_code = bytes[4] >> 3; // 5 primeros bits del byte 5
        mesub = bytes[4] & 7; // 3 último bits del byte 5

        //console.log("Type Code: " + type_code  + " " + typeof (type_code));
        //console.log("Mesub: " + mesub + " "  + typeof(mesub));

        // Convert extended squitter type and subtype to string

        if (type_code >= 1 && type_code <= 4) {
            tipo_mensaje = "Aircraft Identification and Category";
        }
        else if (type_code >= 5 && type_code <= 8) {
            tipo_mensaje = "Surface Position";
        }
        else if (type_code >= 9 && type_code <= 18) {
            tipo_mensaje = "Airborne Position (Baro Altitude)";
        }
        else if (type_code == 19 && mesub >= 1 && mesub <= 4) {
            tipo_mensaje = "Airborne Velocity";
        }
        else if (type_code >= 20 && type_code <= 22) {
            tipo_mensaje = "Airborne Position (GNSS Height)";
        }
        else if (type_code == 23 && mesub === 0) {
            tipo_mensaje = "Test Message";
        }
        else if (type_code == 24 && mesub == 1) {
            tipo_mensaje = "Surface System Status";
        }
        else if (type_code == 28 && mesub == 1) {
            tipo_mensaje = "Extended Squitter Aircraft Status (Emergency)";
        }
        else if (type_code == 28 && mesub == 2) {
            tipo_mensaje = "Extended Squitter Aircraft Status (1090ES TCAS RA)";
        }
        else if (type_code == 29 && (mesub === 0 || mesub == 1)) {
            tipo_mensaje = "Target State and Status Message";
        }
        else if (type_code == 31 && (mesub === 0 || mesub == 1)) {
            tipo_mensaje = "Aircraft Operational Status Message";
        }
        console.log("TIPO DE MENSAJE (17): " + tipo_mensaje);
    }

    // Para Mode S Enhanced Surveillance
    /*flight_status = bytes[0] & 7;
    downlink_request = bytes[1] >> 3 & 31;
    utility_message = ((bytes[1] & 7) << 3) | bytes[2] >> 5;

    switch (flight_status) {
        case 0:
            flight_status_decode = "Normal, Airborne";
            break;
        case 1:
            flight_status_decode = "Normal, On the ground";
            break;
        case 2:
            flight_status_decode = "ALERT, Airborne";
            break;
        case 3:
            flight_status_decode = "ALERT, On the ground";
            break;
        case 4:
            flight_status_decode = "ALERT & Special Position Identification. Airborne or Ground";
            break;
        case 5:
            flight_status_decode = "Special Position Identification. Airborne or Ground";
            break;
        default:
            flight_status_decode = "Unknown flight status";
            break;
    }

    //console.log("FLIGHT STATUS: " + flight_status_decode);
*/

    // Decode 13 bit altitude for DF0, DF4, DF16, DF20
    // This is mostly in "short" messages, except DF20, which is "long" or "extended"
    if (downlink_format === 0 || downlink_format == 4 || downlink_format == 16 || downlink_format == 20) {

        // Dirección ICAO, siempre está
        icao_address[0] = bytes[1].toString(16);
        icao_address[1] = bytes[2].toString(16);
        icao_address[2] = bytes[3].toString(16);

        icao_address_decode =  icao_address[0] + "" + icao_address[1] + "" + icao_address[2];

        console.log("DIRECCIÓN OACI: " + icao_address_decode);
        var m_bit = bytes[3] & (1 << 6);
        var q_bit = bytes[3] & (1 << 4);

        if (!m_bit) {
            if (q_bit) {
                // N is the 11 bit integer resulting from the removal of bit Q and M
                var n = ((bytes[2] & 31) << 6) | ((bytes[3] & 0x80) >> 2) | ((bytes[3] & 0x20) >> 1) | (bytes[3] & 15);

                altitud = (n * 25) - 1000;

                console.log("ALTITUD AC13: " + altitud + " ft");
            }
        }
    }

    // Decode extended squitter specific stuff for type "ADS-B message"
    if (downlink_format == 17) {
        // Identificación de la aeronave
        var flight_id = [];
        if (type_code >= 1 && type_code <= 4) {
            // Tabla para la decodificación del callsign
            flight_decoder = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ#####_###############0123456789######";
            tipo_aeronave = type_code - 1;
            flight_id[0] = bytes[5] >> 2;
            flight_id[1] = ((bytes[5] & 3) << 4) | (bytes[6] >> 4);
            flight_id[2] = ((bytes[6] & 15) << 2) | (bytes[7] >> 6);
            flight_id[3] = bytes[7] & 63;
            flight_id[4] = bytes[8] >> 2;
            flight_id[5] = ((bytes[8] & 3) << 4) | (bytes[9] >> 4);
            flight_id[6] = ((bytes[9] & 15) << 2) | (bytes[10] >> 6);
            flight_id[7] = bytes[10] & 63;
            for (var i = 0; i < flight_id.length-1; i++) {
                callsign = callsign + (flight_decoder.substring(flight_id[i],flight_id[i]+1));
            }
            console.log("TIPO DE AERONAVE: " + tipo_aeronave);
            console.log("CALLSIGN: " + callsign);
        }

        // Posición (Baro-altitude)
        else if (type_code >= 9 && type_code <= 18) {
            fflag = bytes[6] & (1 << 2);
            tflag = bytes[6] & (1 << 3);

            var q_bit = bytes[5] & 1;

            if (q_bit) {
                // N is the 11 bit integer resulting from the removal of bit Q
                var n = ((bytes[5] >> 1) << 4) | ((bytes[6] & 0xF0) >> 4);

                altitud = (n * 25) - 1000;

                console.log("ALTITUD AC12: " + altitud + " ft");

                latitud_raw = ((bytes[6] & 3) << 15) | (bytes[7] << 7) | (bytes[8] >> 1);
                longitud_raw = ((bytes[8] & 1) << 16) | (bytes[9] << 8) | bytes[10];
                console.log("LATITUD: " + latitud_raw + " - LONGITUD: " + longitud_raw);

                // Decodifica la posición a partir de una posición inicial dada
                var ByteToBinary = bytes[7].toString(2);

                while(ByteToBinary.length<8){
                    ByteToBinary = "0" + ByteToBinary;
                }
                even_odd = ByteToBinary.substring(5,6);
                console.log("binario: " + ByteToBinary);
                console.log("byte 7: " + bytes[7]);
                console.log("Par_impar: " + even_odd);

                if (even_odd == 0){ // Even
                    dLat = 60;
                }
                else{ // Odd
                    dLat = 360/59;
                }

                var j = Math.trunc(latitud_ref/dLat) + Math.trunc((latitud_ref-dLat*Math.trunc(latitud_ref/dLat)/dLat)-latitud_raw+0.5);
                latitud_decode = dLat*(j+latitud_raw)

                // NL(latitud_decode)
                var NZ = 15;
                var NL = Math.trunc(2*Math.PI/(Math.acos(1-(1-Math.cos(Math.PI/(2*NZ)))/(Math.pow(latitud_decode*Math.PI/180,2)))));

                if (NL > 0){
                    dLon = 360/NL;
                }
                else{
                    dLon = 360;
                }

                m = Math.trunc(longitud_ref/dLon) + Math.trunc((longitud_ref-dLon*Math.trunc(longitud_ref/dLon))/dLon-longitud_raw+0.5);
                longitud_decode = dLon*(m+longitud_raw);

                console.log("LATITUD DECODIFICADA: " + latitud_decode);
                console.log("LONGITUD DECODIFICADA: " + longitud_decode);
            }
        }
        // Velocidad y Rumbo
        else if (type_code == 19 && mesub >= 1 && mesub <= 4) {
                // Velocidad
            if (mesub == 1 || mesub == 2) {
                direccion_este_oeste = (bytes[5] & 4) >> 2;
                velocidad_este_oeste = ((bytes[5] & 3) << 8) | bytes[6];
                direccion_norte_sur = (bytes[7] & 0x80) >> 7;
                velocidad_norte_sur = ((bytes[7] & 0x7f) << 3) | ((bytes[8] & 0xe0) >> 5);
                fuente_velocidad_vertical = (bytes[8] & 0x10) >> 4;
                signo_velocidad_vertical = (bytes[8] & 0x8) >> 5;
                velocidad_vertical = ((bytes[8] & 7) << 6) | ((bytes[9] & 0xfc) >> 2);

                // Calcula la velocidad a partir de las componentes
                velocidad = Math.sqrt(velocidad_norte_sur * velocidad_norte_sur + velocidad_este_oeste * velocidad_este_oeste);
                console.log("VELOCIDAD: " + velocidad);
                console.log("VELOCIDAD VERTICAL: " + signo_velocidad_vertical + " " + velocidad_vertical);

                if (velocidad) {

                    if (direccion_este_oeste) velocidad_este_oeste *= -1;
                    if (direccion_norte_sur) velocidad_norte_sur *= -1;
                    heading = Math.atan2(velocidad_este_oeste, velocidad_norte_sur);

                    // Convierte a grados
                    heading = heading * 360 / (Math.PI * 2);

                    // Escala 0-360 grados
                    if (heading < 0) heading += 360;
                }
                else {
                    heading = 0;
                }
            }
            // Rumbo
            else if (mesub == 3 || mesub == 4) {
                heading_is_valid = bytes[5] & (1 << 2);
                heading = (360.0 / 128) * (((bytes[5] & 3) << 5) | (bytes[6] >> 3));
            }
            console.log("HEADING: " + heading);

        }
    }
    console.log();
}