const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const salas = {};

const palabrasDificultad = {
    facil: [
        "Manzana", "Bicicleta", "Teléfono", "Guitarra", "Helado", "Espejo", "Tigre", "Computadora", 
        "Zapatos", "Avión", "Montaña", "Reloj", "Cuchara", "Libro", "Coche", "Piscina", "Cámara", 
        "Sombrero", "Pelota", "Tijeras", "Silla", "Televisión", "Paraguas", "Gafas", "Hamburguesa", 
        "Tren", "Árbol", "Lápiz", "Dinosaurio", "Robot", "Perro", "Sol", "Estrella", "Nube", "Lluvia", 
        "Pantalón", "Camisa", "Calcetín", "Cama", "Puerta", "Ventana", "Mesa", "Tenedor", "Cuchillo", 
        "Plato", "Vaso", "Taza", "Botella", "Leche", "Agua", "Jugo", "Pan", "Queso", "Huevo", "Pollo", 
        "Vaca", "Cerdo", "Caballo", "Oveja", "Pájaro", "Pez", "Rana", "Araña", "Hormiga", "Mariposa", 
        "Flor", "Hierba", "Piedra", "Arena", "Nieve", "Hielo", "Fuego", "Viento", "Casa", "Edificio", 
        "Puente", "Calle", "Semáforo", "Autobús", "Moto", "Barco", "Helicóptero", "Cohete", "Oso", 
        "Rompecabezas", "Pintura", "Pincel", "Goma", "Regla", "Mochila", "Cuaderno", "Pizarra", 
        "Escuela", "Profesor", "Médico", "Policía", "Bombero", "Payaso", "Rey", "Reina", "Castillo", 
        "Espada", "Escudo", "Arco", "Flecha", "Guante", "Bufanda", "Abrigo", "Anillo", "Collar", 
        "Peine", "Cepillo", "Jabón", "Toalla", "Baño", "Cocina", "Dormitorio", "Salón", "Jardín", 
        "Parque", "Bosque", "Playa", "Río", "Lago", "Mar", "Isla", "Cueva", "Desierto", "Selva", 
        "Granja", "Ciudad", "Pueblo", "Tomate", "Lechuga", "Zanahoria", "Fresa", "Plátano", "Uva", 
        "Limón", "Naranja", "Pera", "Sandía", "Melón", "Cebolla", "Ajo", "Sopa", "Pizza", "Pastel", 
        "Galleta", "Caramelo", "Chocolate"
    ],
    normal: [
        "Gravedad", "Egipto", "Vampiro", "Minecraft", "Astronauta", "Tornado", "Electricidad", 
        "Satélite", "Pirata", "Volcán", "Microscopio", "Ajedrez", "Ninja", "Internet", "Fantasma", 
        "Submarino", "Galaxia", "Jujutsu", "Terraria", "Billar", "Cine", "Zombie", "Océano", "Magia", 
        "Dragón", "Buceo", "Detectives", "Búnker", "Universo", "Agujero Negro", "Máquina del Tiempo", 
        "Teletransporte", "Ciberpunk", "Steampunk", "Mitología", "Olimpo", "Valhalla", "Samurái", 
        "Gladiador", "Vikingo", "Caballero", "Hechicero", "Elfo", "Enano", "Orco", "Sirena", "Kraken", 
        "Yeti", "Ovni", "Alienígena", "Abducción", "Conspiración", "Espía", "Agente", "Hacker", 
        "Algoritmo", "Inteligencia Artificial", "Realidad Virtual", "Multiverso", "Paradoja", 
        "Entropía", "Sinfonía", "Orquesta", "Museo", "Galería", "Escultura", "Poesía", "Filosofía", 
        "Psicología", "Anatomía", "ADN", "Evolución", "Fósil", "Meteorito", "Constelación", "Nebulosa", 
        "Supernova", "Eclipse", "Aurora", "Glaciar", "Tsunami", "Terremoto", "Huracán", "Monzón", 
        "Oasis", "Espejismo", "Pirámide", "Esfinge", "Coliseo", "Muralla", "Torre", "Rascacielos", 
        "Metrópolis", "Ruinas", "Tesoro", "Mapa", "Brújula", "Telescopio", "Radar", "Sonar", "Dron", 
        "Holograma", "Cyborg", "Nanotecnología", "Clonación", "Mutación", "Superpoder", "Héroe", 
        "Villano", "Cómic", "Videojuego", "Consola", "Pixel", "Avatar", "Streaming", "Podcast", 
        "Viral", "Meme", "Influencer", "Criptomoneda", "Blockchain", "NFT", "Servidor", "Encriptación", 
        "Contraseña", "Firewall", "Malware", "Spam", "Phishing", "Troll", "Hater", "Spoiler", "Fanfic", 
        "Cosplay", "Convención", "Torneo", "Campeonato", "Medalla", "Trofeo", "Récord", "Maratón", 
        "Olimpiadas", "Estadio", "Árbitro", "Penalti", "Canasta", "Jonrón", "Touchdown", "Impresora 3D", 
        "Filamento", "Extrusor", "Sublimación", "Láser", "Grabado", "Vector", "Illustrator", "Anime", 
        "Manga", "Otaku", "Shonen", "Isekai", "RPG", "Shooter", "Arcade", "Pinball", "Joystick", 
        "Teclado", "Monitor", "Auriculares", "Micrófono", "Webcam", "Router", "Bluetooth", "Wifi"
    ],
    dificil: [
        "Corona", "Banco", "Planta", "Carta", "Gato", "Ratón", "Órgano", "Pila", "Mango", "Sierra", 
        "Vela", "Cura", "Capital", "Falda", "Cometa", "Muñeca", "Lima", "Luna", "Copa", "Bota", 
        "Hoja", "Pico", "Cubo", "Radio", "Gemelos", "Lengua", "Mono", "Nada", "Vino", "Cobre", 
        "Sobre", "Sal", "Cerca", "Cara", "Cita", "Corte", "Diario", "Don", "Escala", "Gota", 
        "Granada", "Grave", "Leyenda", "Llama", "Manga", "Mano", "Marco", "Masa", "Metro", "Mina", 
        "Moral", "Nave", "Nudo", "Ojo", "Onda", "Orden", "Pasaje", "Pasta", "Pata", "Pendiente", 
        "Pluma", "Polo", "Presa", "Regla", "Salsa", "Tabla", "Taco", "Tapa", "Tibio", "Tiro", 
        "Tronco", "Canal", "Café", "Cabo", "Bomba", "Bola", "Banda", "Cámara", "Clavo", "Cola", 
        "Cuadro", "Estrella", "Fallo", "Foco", "Fuerte", "Goma", "Gallo", "Llave", "Malla", "Mazo", 
        "Paso", "Perla", "Pinta", "Blanco", "Botón", "Diana", "Prima", "Rollo", "Serie", "Tanque", 
        "Timbre", "Tipo", "Canto", "Cardenal", "Celda", "Clima", "Corriente", "Cuarto", "Cubierta", 
        "Curso", "Destino", "Dirección", "Dominó", "Escudo", "Esposa", "Estación", "Finca", "Flamenco", 
        "Frente", "Fuente", "General", "Grado", "Guía", "Haz", "Herradura", "Imán", "Índice", "Junta", 
        "Justo", "Lazo", "Letra", "Libra", "Lince", "Lista", "Lote", "Maceta", "Madre", "Marcha", 
        "Mayor", "Medio", "Mora", "Mortero", "Muelle", "Nota", "Objeto", "Oro", "Osa", "Paca", "Paje", 
        "Pala", "Palma", "Palo", "Papa", "Paseo", "Pato", "Pavo", "Pegamento", "Pelo", "Pena", "Perico", 
        "Pie", "Pieza", "Piloto", "Pimienta", "Pino", "Piña", "Pipa", "Pique", "Pista", "Pito", "Plata"
    ]
};

function generarCodigoSala() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let codigo = '';
    for (let i = 0; i < 4; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}

function obtenerSalasPublicas() {
    return Object.keys(salas)
        .filter(codigo => salas[codigo].reglas && salas[codigo].reglas.publica && salas[codigo].estado === 'esperando')
        .map(codigo => ({
            codigo: codigo,
            nombreSala: salas[codigo].nombreSala, // Agregado para mandarlo al menú
            jugadores: salas[codigo].jugadores.length
        }));
}

function refrescarSalasPublicas() {
    io.emit('listaSalasPublicas', obtenerSalasPublicas());
}

io.on('connection', (socket) => {
    
    socket.on('pedirSalasPublicas', () => {
        socket.emit('listaSalasPublicas', obtenerSalasPublicas());
    });

    // Modificado para recibir un objeto en lugar de un string
    socket.on('crearSala', (datos) => {
        const { nombreJugador, nombreSala } = datos;
        if (!nombreJugador) return;

        let codigo = generarCodigoSala();
        while(salas[codigo]) { codigo = generarCodigoSala(); }
        
        salas[codigo] = {
            nombreSala: nombreSala || `Misión ${codigo}`, // Si lo dejan vacío, le da un nombre automático
            host: socket.id,
            jugadores: [ { id: socket.id, nombre: nombreJugador } ],
            estado: 'esperando',
            puntosTotales: {},
            palabrasUsadas: [],
            reglas: { publica: true } 
        };
        
        socket.join(codigo);
        socket.emit('salaCreada', { codigo: codigo, nombreSala: salas[codigo].nombreSala, jugadores: salas[codigo].jugadores });
        refrescarSalasPublicas();
    });

    socket.on('cambiarPrivacidad', (datos) => {
        const { codigo, esPublica } = datos;
        if (salas[codigo] && salas[codigo].host === socket.id) {
            salas[codigo].reglas.publica = esPublica;
            refrescarSalasPublicas();
        }
    });

    socket.on('unirseSala', (datos) => {
        const nombre = datos.nombre;
        const codigo = datos.codigo ? datos.codigo.toUpperCase() : "";
        
        if (salas[codigo]) {
            if (salas[codigo].jugadores.length >= 10) {
                return socket.emit('errorSala', 'La sala está llena.');
            }
            salas[codigo].jugadores.push({ id: socket.id, nombre: nombre });
            socket.join(codigo);
            // Mandamos el nombreSala también a los que se unen
            socket.emit('unidoASala', { codigo: codigo, nombreSala: salas[codigo].nombreSala, jugadores: salas[codigo].jugadores });
            socket.to(codigo).emit('jugadoresActualizados', salas[codigo].jugadores);
            refrescarSalasPublicas();
        } else {
            socket.emit('errorSala', 'El código de la sala no existe.');
        }
    });

    socket.on('iniciarPartida', (datos) => {
        const { codigo, reglas } = datos;
        const sala = salas[codigo];
        if (sala && sala.host === socket.id) {
            if (sala.jugadores.length < 3) {
                return socket.emit('errorSala', 'Se necesitan al menos 3 agentes para la misión.');
            }
            sala.reglas = reglas;
            sala.rondaActual = 1;
            sala.puntosTotales = {};
            sala.jugadores.forEach(j => sala.puntosTotales[j.id] = 0);
            prepararNuevaRonda(codigo);
            refrescarSalasPublicas(); 
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
            sala.palabrasUsadas = [];
            sala.puntosTotales = {};
            sala.jugadores.forEach(j => sala.puntosTotales[j.id] = 0);
            if (sala.timerEscritura) clearTimeout(sala.timerEscritura);
            if (sala.timerVotacion) clearTimeout(sala.timerVotacion);
            io.to(codigo).emit('partidaReiniciadaCompletamente');
            refrescarSalasPublicas();
        }
    });

    socket.on('enviarPalabra', (datos) => {
        const { codigo, palabra } = datos;
        const sala = salas[codigo];
        if (sala && sala.estado === 'jugando') {
            const tiempoTranscurrido = (Date.now() - sala.inicioRonda) / 1000;
            let ganoBonus = false;
            if (sala.reglas.bonusVelocidad && tiempoTranscurrido <= (sala.reglas.tiempoBonus || 10)) {
                ganoBonus = true;
            }
            sala.palabrasEnviadas.push({ idJugador: socket.id, palabra, ganoBonus });
            io.to(codigo).emit('nuevaPalabraTablero', palabra);
            if (sala.palabrasEnviadas.length === sala.jugadores.length) {
                clearTimeout(sala.timerEscritura);
                iniciarFaseVotacion(codigo);
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

    socket.on('abandonarPartida', () => manejarDesconexion(socket));
    socket.on('disconnect', () => manejarDesconexion(socket));

    function prepararNuevaRonda(codigo) {
        const sala = salas[codigo];
        if (!sala) return;
        sala.estado = 'jugando';
        sala.palabrasEnviadas = [];
        sala.votosConfirmados = 0;
        sala.votosPreliminares = {};
        sala.votosFinales = {};
        sala.inicioRonda = Date.now(); 

        const dif = sala.reglas.dificultad || 'normal';
        let opciones = palabrasDificultad[dif].filter(p => !sala.palabrasUsadas.includes(p));
        if (opciones.length === 0) {
            sala.palabrasUsadas = [];
            opciones = palabrasDificultad[dif];
        }

        const palabraSecreta = opciones[Math.floor(Math.random() * opciones.length)];
        sala.palabrasUsadas.push(palabraSecreta);
        sala.palabraSecreta = palabraSecreta;

        let jugadoresMezclados = [...sala.jugadores].sort(() => Math.random() - 0.5);
        let numImpostores = Math.min(sala.reglas.impostores || 1, sala.jugadores.length - 1);
        
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
                    puntosRonda = sala.reglas.camuflaje ? (sala.reglas.puntosCamuflaje || 2) : 2; 
                    textoRazon = `+${puntosRonda} (Camuflaje)`; 
                } else { textoRazon = "0 (Descubierto)"; }
            } else {
                if (acertoVoto) { 
                    puntosRonda = 1; 
                    textoRazon = "+1 (Acertaste)"; 
                    const envio = sala.palabrasEnviadas.find(p => p.idJugador === jugador.id);
                    if (envio && envio.ganoBonus) {
                        const ptsExtra = sala.reglas.puntosBonus || 1;
                        puntosRonda += ptsExtra;
                        textoRazon += ` | +${ptsExtra} Bonus ⚡`;
                    }
                } else { textoRazon = "0 (Fallaste)"; }
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

    function manejarDesconexion(socket) {
        for (const codigo in salas) {
            const sala = salas[codigo];
            const index = sala.jugadores.findIndex(j => j.id === socket.id);
            
            if (index !== -1) {
                const eraHost = sala.host === socket.id;
                sala.jugadores.splice(index, 1);
                
                if (sala.jugadores.length === 0) {
                    delete salas[codigo];
                } else {
                    if (eraHost) {
                        sala.host = sala.jugadores[0].id;
                        io.to(sala.host).emit('nuevoHost'); 
                    }
                    io.to(codigo).emit('jugadoresActualizados', sala.jugadores);
                    if (sala.estado !== 'esperando' && sala.jugadores.length < 3) {
                        io.to(codigo).emit('errorSala', 'Jugadores insuficientes. La partida ha terminado.');
                        sala.estado = 'esperando';
                        io.to(codigo).emit('partidaReiniciadaCompletamente');
                    }
                }
                refrescarSalasPublicas();
                break;
            }
        }
    }
}); 

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});