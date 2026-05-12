const socket = io();

// ==========================================
// CONFIGURACIÓN DE AUDIO (Definir al inicio)
// ==========================================
const sonidos = {
    ticTac: new Audio('/sounds/timer.mp3'),
    alarma: new Audio('/sounds/alert.mp3'),
    revelar: new Audio('/sounds/reveal.mp3')
};
sonidos.ticTac.volume = 0.5;

// ==========================================
// REFERENCIAS AL DOM
// ==========================================
const panelConfiguracion = document.getElementById('panel-configuracion');
const mensajeEspera = document.getElementById('mensaje-espera');
const contadorJugadores = document.getElementById('contador-jugadores');
const inputNombre = document.getElementById('nombre-jugador');
const inputCodigo = document.getElementById('codigo-sala');
const btnCrearSala = document.getElementById('btn-crear-sala');
const btnUnirseSala = document.getElementById('btn-unirse-sala');
const pantallaInicio = document.getElementById('pantalla-inicio');
const pantallaSala = document.getElementById('pantalla-sala');
const displayCodigoSala = document.getElementById('display-codigo-sala');
const listaNombres = document.getElementById('lista-nombres');
const btnIniciarPartida = document.getElementById('btn-iniciar-partida');
const pantallaJuego = document.getElementById('pantalla-juego');
const tituloRol = document.getElementById('titulo-rol');
const descripcionRol = document.getElementById('descripcion-rol');
const tiempoRestante = document.getElementById('tiempo-restante');
const inputPalabra = document.getElementById('input-palabra');
const btnEnviarPalabra = document.getElementById('btn-enviar-palabra');
const listaPalabrasTablero = document.getElementById('lista-palabras-tablero');
const panelEscribir = document.getElementById('panel-escribir');
const pantallaVotacion = document.getElementById('pantalla-votacion');
const gridVotacion = document.getElementById('grid-votacion');
const btnConfirmarVoto = document.getElementById('btn-confirmar-voto');
const tiempoVotacion = document.getElementById('tiempo-votacion');
const pantallaResultados = document.getElementById('pantalla-resultados');
const nombreImpostorRevelado = document.getElementById('nombre-impostor-revelado');
const listaResultados = document.getElementById('lista-resultados');
const btnSiguienteRonda = document.getElementById('btn-siguiente-ronda');
const mensajeEsperaResultados = document.getElementById('mensaje-espera-resultados');
const btnReinicioTotal = document.getElementById('btn-reinicio-total');

// VARIABLES DE ESTADO
let temporizadorVisual;
let idVotoSeleccionado = null;
let votoConfirmado = false;

// ==========================================
// EVENTOS DE BOTONES
// ==========================================

btnCrearSala.addEventListener('click', () => {
    const nombre = inputNombre.value.trim();
    if(nombre) socket.emit('crearSala', nombre);
});

btnUnirseSala.addEventListener('click', () => {
    const nombre = inputNombre.value.trim();
    const codigo = inputCodigo.value.trim();
    if(nombre && codigo) socket.emit('unirseSala', { nombre, codigo });
});

btnIniciarPartida.addEventListener('click', () => {
    const configuracion = {
        rondas: parseInt(document.getElementById('config-rondas').value),
        impostores: parseInt(document.getElementById('config-impostores').value),
        tiempo: parseInt(document.getElementById('config-tiempo').value),
        bonusVelocidad: document.getElementById('config-bonus').checked,
        tiempoBonus: parseInt(document.getElementById('config-tiempo-bonus').value),
        puntosBonus: parseInt(document.getElementById('config-puntos-bonus').value),
        camuflaje: document.getElementById('config-camuflaje').checked,
        puntosCamuflaje: parseInt(document.getElementById('config-puntos-camuflaje').value)
    };
    socket.emit('iniciarPartida', { codigo: displayCodigoSala.textContent, reglas: configuracion });
});

btnEnviarPalabra.addEventListener('click', () => {
    const palabra = inputPalabra.value.trim();
    if (palabra) {
        socket.emit('enviarPalabra', { codigo: displayCodigoSala.textContent, palabra });
        panelEscribir.style.display = 'none';
    }
});

btnConfirmarVoto.addEventListener('click', () => {
    if (idVotoSeleccionado && !votoConfirmado) {
        votoConfirmado = true;
        btnConfirmarVoto.disabled = true;
        socket.emit('confirmarVoto', { codigo: displayCodigoSala.textContent, votoPara: idVotoSeleccionado });
    }
});

btnSiguienteRonda.addEventListener('click', () => {
    socket.emit('siguienteRonda', { codigo: displayCodigoSala.textContent });
});

btnReinicioTotal.addEventListener('click', () => {
    const confirmar = confirm("¿Estás seguro de reiniciar? Se borrarán todos los puntos y volverán a la sala de espera.");
    if (confirmar) {
        socket.emit('reinicioTotal', { codigo: displayCodigoSala.textContent });
    }
});

// ==========================================
// RESPUESTAS SOCKET
// ==========================================

socket.on('salaCreada', (datos) => {
    pantallaInicio.style.display = 'none';
    pantallaSala.style.display = 'block';
    displayCodigoSala.textContent = datos.codigo;
    btnIniciarPartida.style.display = 'block';
    btnReinicioTotal.style.display = 'block'; 
    panelConfiguracion.style.display = 'block';
    mensajeEspera.style.display = 'none';
    actualizarLista(datos.jugadores);
});

socket.on('unidoASala', (datos) => {
    pantallaInicio.style.display = 'none';
    pantallaSala.style.display = 'block';
    displayCodigoSala.textContent = datos.codigo;
    btnIniciarPartida.style.display = 'none';
    btnReinicioTotal.style.display = 'none'; 
    actualizarLista(datos.jugadores);
});

socket.on('rolAsignado', (datos) => {
    pantallaSala.style.display = 'none';
    pantallaResultados.style.display = 'none';
    pantallaJuego.style.display = 'block';
    listaPalabrasTablero.innerHTML = '';
    panelEscribir.style.display = 'block';
    iniciarReloj(datos.tiempo, tiempoRestante);
    descripcionRol.textContent = datos.rol === 'Infiltrado' ? 'INFILTRADO' : datos.palabra;
    descripcionRol.style.color = datos.rol === 'Infiltrado' ? "#ff4d4d" : "#d4af37";
});

socket.on('mostrarResultados', (datosFinales) => {
    clearInterval(temporizadorVisual);
    if(sonidos.revelar) sonidos.revelar.play(); 
    
    pantallaVotacion.style.display = 'none';
    pantallaResultados.style.display = 'block';
    
    nombreImpostorRevelado.textContent = datosFinales.impostor;
    listaResultados.innerHTML = '';
    
    if (datosFinales.partidaTerminada) {
        const ganador = datosFinales.detalles[0];
        const corona = document.createElement('div');
        corona.style.textAlign = "center";
        corona.style.marginBottom = "20px";
        corona.innerHTML = `
            <h1 style="color: #d4af37; font-family: 'Cinzel', serif; margin-bottom: 0;">🏆 GANADOR 🏆</h1>
            <h2 style="font-size: 2.5rem; color: #fff; margin-top: 5px; text-shadow: 0 0 10px #d4af37;">${ganador.nombre}</h2>
            <p style="color: #d4af37; font-weight: bold;">Puntaje Final: ${ganador.puntosAcumulados} pts</p>
            <hr style="border: 0; border-top: 1px solid rgba(212, 175, 55, 0.3); margin: 20px 0;">
        `;
        listaResultados.appendChild(corona);
    }

    datosFinales.detalles.forEach((d, index) => {
        if (datosFinales.partidaTerminada && index === 0) return;

        const li = document.createElement('li');
        li.style.background = "rgba(255,255,255,0.05)";
        li.style.padding = "10px 15px";
        li.style.borderRadius = "8px";
        li.style.marginBottom = "10px";
        li.style.listStyle = "none";
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${index + 1}. ${d.nombre}</strong>
                <span style="color: #d4af37; font-weight: bold;">${d.puntosAcumulados} pts</span>
            </div>
            <div style="color: #888; font-size: 0.8rem;">${d.razon}</div>
        `;
        listaResultados.appendChild(li);
    });

    const esHost = btnIniciarPartida.style.display === 'block';
    if (datosFinales.partidaTerminada) {
        btnSiguienteRonda.style.display = 'none';
        mensajeEsperaResultados.innerHTML = "<span style='color: #d4af37; font-weight: bold;'>¡FIN DEL JUEGO!</span>";
    } else {
        btnSiguienteRonda.style.display = esHost ? 'block' : 'none';
        mensajeEsperaResultados.style.display = esHost ? 'none' : 'block';
        mensajeEsperaResultados.textContent = "Esperando al Host...";
    }
});

socket.on('partidaReiniciadaCompletamente', () => {
    alert("Partida reiniciada por el Host.");
    pantallaJuego.style.display = 'none';
    pantallaVotacion.style.display = 'none';
    pantallaResultados.style.display = 'none';
    pantallaSala.style.display = 'block';
    listaPalabrasTablero.innerHTML = '';
});

socket.on('jugadoresActualizados', (jugadores) => actualizarLista(jugadores));
socket.on('nuevaPalabraTablero', (palabra) => {
    const li = document.createElement('li');
    li.textContent = palabra;
    listaPalabrasTablero.appendChild(li);
});

socket.on('iniciarVotacion', (datos) => {
    pantallaJuego.style.display = 'none';
    pantallaVotacion.style.display = 'block';
    gridVotacion.innerHTML = '';
    votoConfirmado = false;
    btnConfirmarVoto.disabled = true;
    iniciarReloj(datos.tiempo, tiempoVotacion);
    datos.jugadores.forEach(jugador => {
        if (jugador.id === socket.id) return;
        const div = document.createElement('div');
        div.className = 'tarjeta-voto';
        div.innerHTML = `<strong>${jugador.nombre}</strong><br><small>"${jugador.palabra}"</small><div class="contenedor-votos-previos" id="votos-para-${jugador.id}"></div>`;
        div.onclick = () => {
            if (votoConfirmado) return;
            idVotoSeleccionado = jugador.id;
            btnConfirmarVoto.disabled = false;
            socket.emit('votoPreliminar', { codigo: displayCodigoSala.textContent, sospechosoId: jugador.id });
        };
        gridVotacion.appendChild(div);
    });
});

socket.on('actualizarVotosPreliminares', (votos) => {
    document.querySelectorAll('.contenedor-votos-previos').forEach(c => c.innerHTML = '');
    for (let id in votos) {
        const cont = document.getElementById(`votos-para-${votos[id].sospechosoId}`);
        if (cont) cont.innerHTML += `<span>👁️ ${votos[id].nombre}</span> `;
    }
});

// ==========================================
// AUXILIARES
// ==========================================
function iniciarReloj(t, el) {
    clearInterval(temporizadorVisual);
    if (t <= 0) { el.textContent = "∞"; return; }
    
    temporizadorVisual = setInterval(() => {
        t--;
        el.textContent = `00:${t < 10 ? '0'+t : t}`;
        
        if (t <= 5 && t > 0) {
            if(sonidos.ticTac) sonidos.ticTac.play();
            el.style.color = "#ff4d4d";
        }

        if (t <= 0) {
            clearInterval(temporizadorVisual);
            if(sonidos.alarma) sonidos.alarma.play();
        }
    }, 1000);
}

function actualizarLista(jugadores) {
    listaNombres.innerHTML = '';
    contadorJugadores.textContent = jugadores.length;
    jugadores.forEach(j => {
        const li = document.createElement('li');
        li.textContent = j.nombre;
        listaNombres.appendChild(li);
    });
}