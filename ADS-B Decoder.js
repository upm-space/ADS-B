//##################################
//########### CONEXIONES ###########
//##################################

// Configuración de la coonexión de acuerdo al RTL1090
var net = require('net');
var host = '127.0.0.1';
var port = 31011; // Sergio
//var port = 31001; // Andrés

// Se conecta al puerto TCP especificado anteriormente
var client = net.connect({host: host, port: port}, function(){
    console.log('client connected');
});

// Mientras esté establecida la conexión...
client.on('data', function(data){
    var data_RTL1090 = [];

    // Coge solo la parte que interesa de lo que se recibe del RTL1090, a partir del byte 9
    for (var j=9; j<data.length; j++){
        data_RTL1090.push(data[j]);
    }
    //console.log("DATOS RAW DEC: " + data_RTL1090);

    // Llama a la función que decodifica el paquete
    decoder(data_RTL1090);
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

    // Guarda los valores en la vector byte
    var bytes = [];

    for (var i = 0; i < longitud_mensaje; i++) {
        bytes.push(paquetes[i]);
    }

    // Variables

    var icao_address = [];

    var downlink_format_decode = "";
    var tipo_mensaje = "";
    var flight_decoder = "";
    var latitud_raw = "";
    var longitud_raw = "";
    var direccion_este_oeste = "";
    var velocidad_este_oeste = "";
    var direccion_norte_sur = "";
    var velocidad_norte_sur = "";
    var signo_velocidad_vertical = "";
    var velocidad_vertical = "";
    var signo_velocidad_vertical_decode = ""

    var tipo_aeronave = 0;
    var longitud_ref = -3.724;
    var latitud_ref = 40.441;
    var dLat = 0;
    var dLon = 0;
    var velocidad = 0;
    var heading = 0;
    var altitud= 0;

    var heading_is_valid = false;

    icao_address_decode = "";
    callsign_decode = "";
    latitud_decode = 0;
    longitud_decode = 0;
    velocidad_decode = 0;
    velocidad_vertical_decode = "";
    heading_decode = 0;
    altitud_decode = 0;

    // Tipo de mensaje: Está siempre, 5 primeros bits del primer byte

    downlink_format = bytes[0] >> 3;

    switch (downlink_format) {
        case 0:
            downlink_format_decode = "TIPO DE MENSAJE: Short Air-Air Surveillance";
            break;
        case 20:
            downlink_format_decode = "Mode S Enhanced Surveillance";
            break;
        case 21:
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
            break;
    }
    //console.log("TIPO DE MENSAJE: " + downlink_format_decode);

    if (downlink_format == 17) {
        // Dirección ICAO
        icao_address[0] = bytes[1].toString(16);
        while(icao_address[0].length<2){
            icao_address[0] = "0" + icao_address[0];
        }
        icao_address[1] = bytes[2].toString(16);
        while(icao_address[1].length<2){
            icao_address[1] = "0" + icao_address[1];
        }
        icao_address[2] = bytes[3].toString(16);
        while(icao_address[2].length<2){
            icao_address[2] = "0" + icao_address[2];
        }

        icao_address_decode =  icao_address[0] + "" + icao_address[1] + "" + icao_address[2];
        //console.log("DIRECCIÓN OACI: " + icao_address_decode);

        type_code = bytes[4] >> 3; // 5 primeros bits del byte 5
        mesub = bytes[4] & 7; // 3 último bits del byte 5

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
        // Type code 25-27,29,30: Reserved

        //console.log("MENSAJE ADS-B: " + tipo_mensaje);

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
                callsign_decode = callsign_decode + (flight_decoder.substring(flight_id[i],flight_id[i]+1));
            }
            //console.log("TIPO DE AERONAVE: " + tipo_aeronave);
            //console.log("CALLSIGN: " + callsign_decode);
        }

        // Posición (Baro-altitud)

        else if (type_code >= 9 && type_code <= 18) {
            fflag = bytes[6] & (1 << 2);
            tflag = bytes[6] & (1 << 3);

            var q_bit = bytes[5] & 1;

            if (q_bit) {
                var n = ((bytes[5] >> 1) << 4) | ((bytes[6] & 0xF0) >> 4);

                altitud = (n * 25) - 1000;

                altitud_decode = Math.round(altitud);

                //console.log("ALTITUD: " + altitud + " ft");

                latitud_raw = ((bytes[6] & 3) << 15) | (bytes[7] << 7) | (bytes[8] >> 1);
                longitud_raw = ((bytes[8] & 1) << 16) | (bytes[9] << 8) | bytes[10];
                //console.log("LATITUD CPR: " + latitud_raw + " - LONGITUD CPR: " + longitud_raw);

                // Decodifica la posición a partir de una posición inicial dada

                latitud_normalizada = latitud_raw/131072;
                longitud_normalizada = longitud_raw/131072;

                var ByteToBinary = bytes[6].toString(2);

                while(ByteToBinary.length<8){
                    ByteToBinary = "0" + ByteToBinary;
                }
                even_odd = ByteToBinary.substring(5,6);

                if (even_odd == 0){ // Even
                    dLat = 6;
                }
                else{ // Odd
                    dLat = 360/59;
                }

                var j = Math.floor(latitud_ref/dLat) + Math.floor(((latitud_ref-dLat*Math.floor(latitud_ref/dLat))/dLat)-latitud_normalizada+0.5);
                latitud_decode = dLat*(j+latitud_normalizada);

                var NZ = 15;
                var NL = Math.floor((2*Math.PI)/(Math.acos(1-(1-Math.cos(Math.PI/(2*NZ)))/(Math.pow((latitud_decode*Math.PI)/(180),2)))));

                if (NL > 0){
                    dLon = 360/NL;
                }
                else{
                    dLon = 360;
                }

                var m = Math.floor(longitud_ref/dLon) + Math.floor(((longitud_ref-dLon*Math.floor(longitud_ref/dLon))/dLon)-longitud_normalizada+0.5);
                longitud_decode = dLon*(m+longitud_normalizada);

                //console.log("LATITUD: " + latitud_decode);
                //console.log("LONGITUD: " + longitud_decode);
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
                signo_velocidad_vertical = (bytes[8] & 0x8) >> 5; // UP --> 0 , DOWN --> 1
                velocidad_vertical = ((bytes[8] & 7) << 6) | ((bytes[9] & 0xfc) >> 2);

                if(signo_velocidad_vertical == 0){
                    signo_velocidad_vertical_decode = "+";
                }
                else{
                    signo_velocidad_vertical_decode = "-";
                }

                velocidad_vertical_decode = signo_velocidad_vertical_decode + velocidad_vertical;

                // Calcula la velocidad a partir de las componentes

                velocidad = Math.sqrt(velocidad_norte_sur * velocidad_norte_sur + velocidad_este_oeste * velocidad_este_oeste);
                velocidad_decode = Math.round(velocidad);
                //console.log("VELOCIDAD: " + velocidad);
                //console.log("VELOCIDAD VERTICAL: " + signo_velocidad_vertical_decode + velocidad_vertical);

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
            heading_decode = Math.round(heading);
            //console.log("HEADING: " + heading);
        }
        //console.log();
        save_data();
    }
}

//##################################
//######### ALMACENAMIENTO #########
//##################################

// Constantes de almacenamiento de datos
var vector_vuelos = [];
var vector_datos = [];
var icao_address_decode = "";
var callsign_decode = "";
var latitud_decode = 0;
var longitud_decode = 0;
var velocidad_decode = 0;
var velocidad_vertical_decode = "";
var heading_decode = 0;
var altitud_decode = 0;

// Funcion para almacenar los datos
function save_data() {
    var flag_repetido = false;

    // Para cada paquete de datos se añaden los valores leídos a vector_vuelos
    vector_vuelos[0] = icao_address_decode;
    vector_vuelos[1] = callsign_decode;
    vector_vuelos[2] = latitud_decode;
    vector_vuelos[3] = longitud_decode;
    vector_vuelos[4] = velocidad_decode;
    vector_vuelos[5] = velocidad_vertical_decode;
    vector_vuelos[6] = heading_decode;
    vector_vuelos[7] = altitud_decode;

    // El primer vuelo que se lee se mete directamente en el vector de datos
    if (vector_datos.length == 0){
        vector_datos.push(vector_vuelos.slice());
    }
    // Para los siguientes vuelos se comprueba si el vuelo es nuevo o no con el código OACI
    else {
        for (var i=0; i<vector_datos.length && flag_repetido == false; i++) {
            var icao_address_saved = vector_datos[i];

            // Se comparan los códigos OACI
            if (icao_address_decode == icao_address_saved[0]) {
                // Si son iguales el vuelo es reptido
                console.log("VUELO REPETIDO");
                // Modifica el vector vuelos de forma que sume la información que ya hay con la información nueva
                for (var j=0; j<vector_vuelos.length; j++) {
                    if (vector_vuelos[j] == 0 || vector_vuelos[j] == null){
                        // Si el paquete contiene información cero o nula en algún campo se mantiene la anterior información
                        vector_vuelos[j] = icao_address_saved[j];
                    }
                }
                vector_datos[i] = vector_vuelos.slice();
                flag_repetido = true;
            }
        }
        // Si el vuelo es nuevo lo añade al vector de datos en una nueva posición
        if (flag_repetido == false){
            // El vuelo es nuevo
            console.log("VUELO NUEVO");
            vector_datos.push(vector_vuelos.slice());
        }
    }
    console.log("VECTOR DE DATOS CON TODOS LOS VUELOS:");
    console.log(vector_datos);
    console.log();
}