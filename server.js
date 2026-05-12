const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const salas = {};

const basePalabras = [
    "Sushi", "Taco", "Batman", "Titanic", "París", "Minecraft", "Gato", "Tesla", 
    "Amazonas", "Egipto", "Fútbol", "Café", "Helado", "Facebook", "iPhone", 
    "Marte", "Picasso", "Disney", "Vampiro", "Zombie", "Pirata", "Internet"
];

function generarCodigoSala() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let codigo = '';
    for (let i = 0; i < 4; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}

io.on('connection', (socket) => {
    console.log('Nuevo dispositivo conectado:', socket.id);

    socket.on('crearSala', (nombreJugador) => {
        let codigo = generarCodigoSala();
        while(salas[codigo]) { codigo = generarCodigoSala(); }
        salas[codigo] = {
            host: socket.id,
            jugadores: [ { id: socket.id, nombre: nombreJugador } ],
            estado: 'esperando',
            puntosTotales: {}
        };
        socket.join(codigo);
        socket.emit('salaCreada', { codigo: codigo, jugadores: salas[codigo].jugadores });
    });

    socket.on('unirseSala', (datos) => {
        const nombre = datos.nombre;
        const codigo = datos.codigo.toUpperCase();
        if (salas[codigo]) {
            salas[codigo].jugadores.push({ id: socket.id, nombre: nombre });
            socket.join(codigo);
            socket.emit('unidoASala', { codigo: codigo, jugadores: salas[codigo].jugadores });
            socket.to(codigo).emit('jugadoresActualizados', salas[codigo].jugadores);
        } else {
            socket.emit('errorSala', 'El código de la sala no existe.');
        }
    });

    socket.on('iniciarPartida', (datos) => {
        const { codigo, reglas } = datos;
        const sala = salas[codigo];
        if (sala && sala.host === socket.id) {
            sala.reglas = reglas;
            sala.rondaActual = 1;
            sala.puntosTotales = {};
            sala.jugadores.forEach(j => sala.puntosTotales[j.id] = 0);
            prepararNuevaRonda(codigo);
        }
    });

    socket.on('siguienteRonda', (datos) => {
        const { codigo } = datos;
        const sala = salas[codigo];
        if (sala && sala.host === socket.id) {
            sala.rondaActual++;
            prepararNuevaRonda(codigo);
        }
    });

    socket.on('reinicioTotal', (datos) => {
        const { codigo } = datos;
        const sala = salas[codigo];
        if (sala && sala.host === socket.id) {
            sala.estado = 'esperando';
            sala.puntosTotales = {};
            sala.jugadores.forEach(j => sala.puntosTotales[j.id] = 0);
            if (sala.timerEscritura) clearTimeout(sala.timerEscritura);
            if (sala.timerVotacion) clearTimeout(sala.timerVotacion);
            io.to(codigo).emit('partidaReiniciadaCompletamente');
        }
    });

    function prepararNuevaRonda(codigo) {
        const sala = salas[codigo];
        sala.estado = 'jugando';
        sala.palabrasEnviadas = [];
        sala.votosConfirmados = 0;
        sala.votosPreliminares = {};
        sala.votosFinales = {};
        sala.inicioRonda = Date.now(); 

        const palabraSecreta = basePalabras[Math.floor(Math.random() * basePalabras.length)];
        sala.palabraSecreta = palabraSecreta;

        let jugadoresMezclados = [...sala.jugadores].sort(() => Math.random() - 0.5);
        let numImpostores = Math.min(sala.reglas.impostores, sala.jugadores.length - 1);
        if (numImpostores < 1) numImpostores = 1;
        
        sala.impostores = [];
        for (let i = 0; i < numImpostores; i++) {
            sala.impostores.push(jugadoresMezclados[i].id);
        }

        sala.jugadores.forEach(j => {
            const esImpostor = sala.impostores.includes(j.id);
            io.to(j.id).emit('rolAsignado', {
                rol: esImpostor ? 'Infiltrado' : 'Agente',
                palabra: esImpostor ? null : palabraSecreta,
                tiempo: sala.reglas.tiempo,
                rondaActual: sala.rondaActual
            });
        });

        if (sala.reglas.tiempo > 0) {
            if (sala.timerEscritura) clearTimeout(sala.timerEscritura);
            sala.timerEscritura = setTimeout(() => {
                if (sala.estado === 'jugando') iniciarFaseVotacion(codigo);
            }, sala.reglas.tiempo * 1000);
        }
    }

    socket.on('enviarPalabra', (datos) => {
        const { codigo, palabra } = datos;
        const sala = salas[codigo];
        if (sala && sala.estado === 'jugando') {
            const tiempoTranscurrido = (Date.now() - sala.inicioRonda) / 1000;
            let ganoBonus = false;

            if (sala.reglas.bonusVelocidad && tiempoTranscurrido <= sala.reglas.tiempoBonus) {
                ganoBonus = true;
            }

            sala.palabrasEnviadas.push({ 
                idJugador: socket.id, 
                palabra: palabra,
                ganoBonus: ganoBonus 
            });

            io.to(codigo).emit('nuevaPalabraTablero', palabra);

            if (sala.palabrasEnviadas.length === sala.jugadores.length) {
                clearTimeout(sala.timerEscritura);
                iniciarFaseVotacion(codigo);
            }
        }
    });

    socket.on('votoPreliminar', (datos) => {
        const { codigo, sospechosoId } = datos;
        const sala = salas[codigo];
        if (sala && sala.estado === 'votando') {
            const votante = sala.jugadores.find(j => j.id === socket.id);
            if(votante) {
                sala.votosPreliminares[socket.id] = { nombre: votante.nombre, sospechosoId: sospechosoId };
                io.to(codigo).emit('actualizarVotosPreliminares', sala.votosPreliminares);
            }
        }
    });

    socket.on('confirmarVoto', (datos) => {
        const { codigo, votoPara } = datos;
        const sala = salas[codigo];
        if (sala && sala.estado === 'votando') {
            sala.votosFinales[socket.id] = votoPara;
            sala.votosConfirmados++;
            if (sala.votosConfirmados === sala.jugadores.length) {
                clearTimeout(sala.timerVotacion); 
                calcularResultados(codigo);
            }
        }
    });

    function iniciarFaseVotacion(codigo) {
        const sala = salas[codigo];
        if (!sala) return;
        sala.estado = 'votando';
        const datosRevelacion = sala.jugadores.map(jugador => {
            const envio = sala.palabrasEnviadas.find(p => p.idJugador === jugador.id);
            return { id: jugador.id, nombre: jugador.nombre, palabra: envio ? envio.palabra : "(Sin pista)" };
        });
        io.to(codigo).emit('iniciarVotacion', { jugadores: datosRevelacion, tiempo: sala.reglas.tiempo });

        if (sala.reglas.tiempo > 0) {
            if (sala.timerVotacion) clearTimeout(sala.timerVotacion);
            sala.timerVotacion = setTimeout(() => {
                if (sala.estado === 'votando') calcularResultados(codigo);
            }, sala.reglas.tiempo * 1000);
        }
    }

    function calcularResultados(codigo) {
        const sala = salas[codigo];
        if (!sala) return;
        sala.estado = 'results';
        let detallesPuntos = [];
        const idImpostor = sala.impostores[0];
        const objImpostor = sala.jugadores.find(j => j.id === idImpostor);
        const nombreImpostor = objImpostor ? objImpostor.nombre : "Desconocido";

        sala.jugadores.forEach(jugador => {
            const votoDeEsteJugador = sala.votosFinales[jugador.id] || null;
            let puntosRonda = 0;
            let textoRazon = "";
            let acertoVoto = (votoDeEsteJugador === idImpostor);

            if (jugador.id === idImpostor) {
                let votosEnContra = Object.values(sala.votosFinales).filter(v => v === idImpostor).length;
                if (votosEnContra === 0) { 
                    puntosRonda = sala.reglas.camuflaje ? sala.reglas.puntosCamuflaje : 2; 
                    textoRazon = `+${puntosRonda} (Camuflaje)`; 
                } else { 
                    textoRazon = "0 (Descubierto)"; 
                }
            } else {
                if (acertoVoto) { 
                    puntosRonda = 1; 
                    textoRazon = "+1 (Acertaste)"; 
                    
                    // BONUS DE VELOCIDAD (Solo si acertó y fue rápido)
                    const envio = sala.palabrasEnviadas.find(p => p.idJugador === jugador.id);
                    if (envio && envio.ganoBonus) {
                        const ptsExtra = sala.reglas.puntosBonus || 1;
                        puntosRonda += ptsExtra;
                        textoRazon += ` | +${ptsExtra} Bonus ⚡`;
                    }
                } else { 
                    textoRazon = "0 (Fallaste)"; 
                }
            }

            sala.puntosTotales[jugador.id] += puntosRonda;
            detallesPuntos.push({
                nombre: jugador.nombre,
                puntosAcumulados: sala.puntosTotales[jugador.id],
                razon: textoRazon
            });
        });

        detallesPuntos.sort((a, b) => b.puntosAcumulados - a.puntosAcumulados);
        const partidaTerminada = sala.rondaActual >= sala.reglas.rondas;

        io.to(codigo).emit('mostrarResultados', { 
            impostor: nombreImpostor, 
            detalles: detallesPuntos,
            partidaTerminada: partidaTerminada
        });
    }

    socket.on('disconnect', () => { console.log('Jugador desconectado'); });
}); 

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});