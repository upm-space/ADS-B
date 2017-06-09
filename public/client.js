// DECLARACIONES
var vector_datos = [];
var numero_vuelo = 0;
var vector_vuelos_coord = [[]];
var flag_datos_coordenadas = false;
var flag_datos_callsign = false;
var flag_datos_velocidad = false;
var vector_icao = [];
var vector_callsign = [];
var flag_callsign_repetido = false;
var flag_icao_repetido = false;

var socket = io();

// Recibe si contiene información de coordenadas
socket.on('infro_coordenada', function (data) {
    flag_datos_coordenadas = data.infro_coordenada;
    console.log("FLAG COORDENADA: " + data.infro_coordenada);
});

// Recibe si contiene información de callsign
socket.on('infro_callsign', function (data) {
    flag_datos_callsign = data.infro_callsign;
    console.log("FLAG CALLSIGN: " + data.infro_callsign);
});

// Recibe si contiene información de velocidad
socket.on('infro_velocidad', function (data) {
    flag_datos_velocidad = data.infro_velocidad;
    console.log("FLAG VELOCIDAD: " + data.infro_velocidad);
});

// Recibe el numero de vuelo en el que se han modificado los datos
socket.on('numero_vuelo', function (data) {
    numero_vuelo = data.numero_vuelo;
    console.log("NUMERO VUELO: " + data.numero_vuelo);
});

// Recibe el mensaje con el vector de datos de todos los vuelos
socket.on('adsb_data', function (data) {
    // Envía los datos al HTML
    // addMessage(data.adsb_data);
    // Guarda los datos
    vector_datos = data.adsb_data;

    // Añade los vuelos a la izquierda con su codigo OACI
    for (var i=0; i<vector_datos.length; i++) {
        var icao = (vector_datos[i])[0];
        flag_icao_repetido = false;
        for (var i=0; i<vector_icao.length; i++) {
            if(icao == vector_icao[i]){
                flag_icao_repetido = true;
            }
        }
        if(flag_icao_repetido == false){
            vector_icao.push(icao);
            addICAO(icao);
        }
    }

    // Coge solo los valores de coordenadas
    if(flag_datos_coordenadas == true) {
        // Coge el vuelo del que se han modificado datos dentro del vector de datos
        var datos_vuelo = vector_datos[numero_vuelo];
        // Lee la latitud y longitud
        var latitud = datos_vuelo[2];
        var longitud = datos_vuelo[3];

        if (vector_vuelos_coord.length > numero_vuelo && vector_vuelos_coord[numero_vuelo] != null) {
            // Nueva información de un vuelo que ya existe
            (vector_vuelos_coord[numero_vuelo]).push([latitud, longitud]);
        }
        else{
            //Vuelo nuevo
            vector_vuelos_coord[numero_vuelo] = new Array;
            (vector_vuelos_coord[numero_vuelo]).push([latitud, longitud]);
        }

        for (var i=0; i<vector_vuelos_coord.length; i++){
            if (vector_vuelos_coord [i] != undefined ){
                var polilinea = vector_vuelos_coord [i];
                //console.log("REPRESENTAR: " + polilinea);
                var vector_ruta = L.polyline(polilinea, {color: 'red'}).addTo(mymap);
            }
        }
        // Además envía la información de altitud al panel de la izquierda
        for (var i=0; i<vector_datos.length; i++) {
            var altitud = (vector_datos[i])[7];
            addAltitud(altitud);
        }
    }
    
    // Envía la información de callsign al panel de la izquierda
    if(flag_datos_callsign == true) {
        for (var i=0; i<vector_datos.length; i++) {
            var callsign = (vector_datos[i])[1];
            flag_callsign_repetido = false;
            for (var i=0; i<vector_callsign.length; i++) {
                if(callsign == vector_callsign[i]){
                    flag_callsign_repetido = true;
                }
            }
            if(flag_callsign_repetido == false){
                vector_callsign.push(callsign);
                addCallsign(callsign);
            }
        }
    }
    
    // Envía la información de velocidad al panel de la izquierda
    if(flag_datos_velocidad == true) {
        for (var i=0; i<vector_datos.length; i++) {
            var velocidad_horizontal = (vector_datos[i])[4];
            var velocidad_vertical = (vector_datos[i])[5];
            var rumbo = (vector_datos[i])[6];
            addVelocidad(velocidad_horizontal,velocidad_vertical,rumbo);
        }
    }


});

socket.on('error', console.error.bind(console));
socket.on('message', console.log.bind(console));



var boton_vuelos;
var text;
var li_callsign;
var li_velocidad_horizontal;
var li_velocidad_vertical;
var li_rumbo;
var li_altitud;

// Modifica los codigos ICAO
function addICAO(message){
    // Texto de cada elemento
    text_ICAO = document.createTextNode(message);
    text_callsign = document.createTextNode("Callsign: ...Esperando info");
    text_velocidad_horizontal = document.createTextNode("Velocidad horizontal: ...Esperando info");
    text_velocidad_vertical = document.createTextNode("Velocidad vertical: ...Esperando info");
    text_rumbo = document.createTextNode("Rumbo: ...Esperando info");
    text_altitud = document.createTextNode("Altitud: ...Esperando info");

    messages = document.getElementById('messages');

    // Titulo ICAO
    boton_vuelos = document.createElement('h3');
    boton_vuelos.id = message + numero_vuelo;
    boton_vuelos.appendChild(text_ICAO);
    messages.appendChild(boton_vuelos);

    li_callsign = document.createElement('li');
    li_callsign.id = "callsign_" + numero_vuelo;
    li_callsign.appendChild(text_callsign);
    messages.appendChild(li_callsign);

    li_velocidad_horizontal = document.createElement('li');
    li_velocidad_horizontal.id = "velocidad_horizontal_" + numero_vuelo;
    li_velocidad_horizontal.appendChild(text_velocidad_horizontal);
    messages.appendChild(li_velocidad_horizontal);

    li_velocidad_vertical = document.createElement('li');
    li_velocidad_vertical.id = "velocidad_vertical_" + numero_vuelo;
    li_velocidad_vertical.appendChild(text_velocidad_vertical);
    messages.appendChild(li_velocidad_vertical);

    li_rumbo = document.createElement('li');
    li_rumbo.id = "rumbo_" + numero_vuelo;
    li_rumbo.appendChild(text_rumbo);
    messages.appendChild(li_rumbo);

    li_altitud = document.createElement('li');
    li_altitud.id = "altitud_" + numero_vuelo;
    li_altitud.appendChild(text_altitud);
    messages.appendChild(li_altitud);

    salto_linea = document.createElement('br');
    messages.appendChild(salto_linea);

    salto_linea = document.createElement('br');
    messages.appendChild(salto_linea);
}

// Modifica el callsign
function addCallsign(message) {
    console.log("CAMBIANDO CALLSIGN");
    var callsign_nuevo = document.getElementById("callsign_" + numero_vuelo).innerHTML = ("Callsign: " + message);
}

// Modifica velocidad y rumbo
function addVelocidad(message_velocidad_horizontal, message_velocidad_vertical,message_velocidad_rumbo) {
    console.log("CAMBIANDO VELOCIDAD Y RUMBO");

    var velocidad_horizontal_nuevo = document.getElementById("velocidad_horizontal_" + numero_vuelo).innerHTML = ("Velocidad horizontal: " + message_velocidad_horizontal) + " kt";
    var velocidad_vertical_nuevo = document.getElementById("velocidad_vertical_" + numero_vuelo).innerHTML = ("Velocidad vertical: " + message_velocidad_vertical + " ft/min");
    var rumbo_nuevo = document.getElementById("rumbo_" + numero_vuelo).innerHTML = ("Rumbo: " + message_velocidad_rumbo + "º");
}

// Modifica altitud
function addAltitud(message) {
    console.log("CAMBIANDO ALTITUD");
    var altitud_nuevo = document.getElementById("altitud_" + numero_vuelo).innerHTML = ("Altitud: " + message + " ft");
}