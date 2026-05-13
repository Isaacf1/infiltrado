document.addEventListener("DOMContentLoaded", () => {
    const socket = io(); 

    // ==========================================
    // SISTEMA DE PANTALLAS
    // ==========================================
    function cambiarPantalla(idPantallaActiva) {
        const todasLasPantallas = [
            'pantalla-splash', 
            'pantalla-inicio', 
            'pantalla-sala', 
            'pantalla-juego', 
            'pantalla-votacion', 
            'pantalla-resultados'
        ];

        todasLasPantallas.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.style.setProperty('display', 'none', 'important');
            }
        });

        const pantallaMostrar = document.getElementById(idPantallaActiva);
        if (pantallaMostrar) {
            pantallaMostrar.style.setProperty('display', 'block', 'important');
        }
    }

    setTimeout(() => {
        cambiarPantalla('pantalla-inicio');
        socket.emit('pedirSalasPublicas'); 
    }, 3500); 

    // ==========================================
    // AUDIO Y CONTROLES DOM
    // ==========================================
    const sonidos = {
        intro: new Audio('/sounds/intro.mp3'), 
        ticTac: new Audio('/sounds/timer.mp3'),
        alarma: new Audio('/sounds/alert.mp3'),
        revelar: new Audio('/sounds/reveal.mp3')
    };
    
    // Configuración inicial de audios
    sonidos.intro.loop = true;      
    let volumenActual = 0.2; 
    
    function aplicarVolumen(vol) {
        sonidos.intro.volume = vol;
        sonidos.ticTac.volume = vol === 0 ? 0 : Math.min(1, vol + 0.3); // Efectos un poco más altos
        sonidos.alarma.volume = vol === 0 ? 0 : Math.min(1, vol + 0.3);
        sonidos.revelar.volume = vol === 0 ? 0 : Math.min(1, vol + 0.3);
    }
    
    aplicarVolumen(volumenActual);

    let muteado = false;
    const btnMute = document.getElementById('btn-mute');
    const barraVolumen = document.getElementById('control-volumen');

    // CONTROL: BARRA DESLIZABLE
    if (barraVolumen) {
        barraVolumen.addEventListener('input', (e) => {
            volumenActual = parseFloat(e.target.value);
            aplicarVolumen(volumenActual);

            if (volumenActual === 0) {
                muteado = true;
                if(btnMute) btnMute.textContent = "🔇";
            } else {
                muteado = false;
                if(btnMute) btnMute.textContent = "🔊";
                
                // Si le suben el volumen y está en el lobby, encender la música
                const pJuego = document.getElementById('pantalla-juego');
                if (pJuego && pJuego.style.display !== 'block') {
                    sonidos.intro.play().catch(()=>{});
                }
            }
        });
    }
    
    // CONTROL: BOTÓN DE MUTE
    if (btnMute) {
        btnMute.addEventListener('click', () => {
            muteado = !muteado;
            if (muteado) {
                btnMute.textContent = "🔇";
                aplicarVolumen(0);
                if (barraVolumen) barraVolumen.value = 0;
            } else {
                btnMute.textContent = "🔊";
                volumenActual = 0.2; // Volumen por defecto al desmutear
                aplicarVolumen(volumenActual);
                if (barraVolumen) barraVolumen.value = volumenActual;
                
                const pJuego = document.getElementById('pantalla-juego');
                if (pJuego && pJuego.style.display !== 'block') {
                    sonidos.intro.play().catch(()=>{});
                }
            }
        });
    }

    // TRUCO ANTI-BLOQUEO DE NAVEGADOR
    // Espera el primer toque en la pantalla para iniciar la música
    const iniciarMusicaFondo = () => {
        if (!muteado && volumenActual > 0) {
            const pJuego = document.getElementById('pantalla-juego');
            if (pJuego && pJuego.style.display !== 'block') {
                sonidos.intro.play().catch(()=>{});
            }
        }
        // Nos removemos para no cazar clics toda la partida
        document.removeEventListener('click', iniciarMusicaFondo);
        document.removeEventListener('touchstart', iniciarMusicaFondo);
    };
    
    document.addEventListener('click', iniciarMusicaFondo);
    document.addEventListener('touchstart', iniciarMusicaFondo);

    // Variables de Referencia
    const inputNombre = document.getElementById('nombre-jugador');
    const inputNombreSala = document.getElementById('nombre-sala-input');
    const inputCodigo = document.getElementById('codigo-sala');
    
    const displayCodigoSala = document.getElementById('display-codigo-sala');
    const displayNombreSala = document.getElementById('display-nombre-sala');
    
    const listaNombres = document.getElementById('lista-nombres');
    const contadorJugadores = document.getElementById('contador-jugadores');
    const checkPublica = document.getElementById('config-publica');
    
    const panelEscribir = document.getElementById('panel-escribir');
    const inputPalabra = document.getElementById('input-palabra');
    const listaPalabrasTablero = document.getElementById('lista-palabras-tablero');
    const gridVotacion = document.getElementById('grid-votacion');
    const listaResultados = document.getElementById('lista-resultados');

    let temporizadorVisual;
    let idVotoSeleccionado = null;
    let votoConfirmado = false;

    // ==========================================
    // EVENTOS DE BOTONES Y CONFIGURACIÓN
    // ==========================================

    if (checkPublica) {
        checkPublica.addEventListener('change', (e) => {
            const codigo = displayCodigoSala.textContent;
            socket.emit('cambiarPrivacidad', { codigo: codigo, esPublica: e.target.checked });
        });
    }

    document.getElementById('btn-crear-sala')?.addEventListener('click', () => {
        const nombre = inputNombre ? inputNombre.value.trim() : "Host";
        const nombreSala = inputNombreSala ? inputNombreSala.value.trim() : "";
        
        if(nombre) socket.emit('crearSala', { nombreJugador: nombre, nombreSala: nombreSala });
        else alert("Agente, identifíquese (ingrese su nombre).");
    });

    document.getElementById('btn-unirse-sala')?.addEventListener('click', () => {
        const nombre = inputNombre ? inputNombre.value.trim() : "Agente";
        const codigo = inputCodigo ? inputCodigo.value.trim() : "";
        if(nombre && codigo) socket.emit('unirseSala', { nombre, codigo });
    });

    document.getElementById('btn-abandonar-sala')?.addEventListener('click', () => {
        socket.emit('abandonarPartida');
        location.reload(); 
    });

    document.getElementById('btn-iniciar-partida')?.addEventListener('click', () => {
        const configuracion = {
            rondas: parseInt(document.getElementById('config-rondas')?.value || 5),
            impostores: parseInt(document.getElementById('config-impostores')?.value || 1),
            tiempo: parseInt(document.getElementById('config-tiempo')?.value || 60),
            bonusVelocidad: document.getElementById('config-bonus')?.checked || false,
            tiempoBonus: parseInt(document.getElementById('config-tiempo-bonus')?.value || 10),
            puntosBonus: parseInt(document.getElementById('config-puntos-bonus')?.value || 1),
            camuflaje: document.getElementById('config-camuflaje')?.checked || false,
            puntosCamuflaje: parseInt(document.getElementById('config-puntos-camuflaje')?.value || 2),
            publica: checkPublica?.checked || false,
            dificultad: document.getElementById('config-dificultad')?.value || 'normal'
        };
        socket.emit('iniciarPartida', { codigo: displayCodigoSala.textContent, reglas: configuracion });
    });

    document.getElementById('btn-enviar-palabra')?.addEventListener('click', () => {
        const palabra = inputPalabra ? inputPalabra.value.trim() : "";
        if (palabra) {
            socket.emit('enviarPalabra', { codigo: displayCodigoSala.textContent, palabra });
            if (panelEscribir) panelEscribir.style.setProperty('display', 'none', 'important');
            inputPalabra.value = '';
        }
    });

    document.getElementById('btn-confirmar-voto')?.addEventListener('click', (e) => {
        if (idVotoSeleccionado && !votoConfirmado) {
            votoConfirmado = true;
            e.target.disabled = true;
            socket.emit('confirmarVoto', { codigo: displayCodigoSala.textContent, votoPara: idVotoSeleccionado });
        }
    });

    document.getElementById('btn-siguiente-ronda')?.addEventListener('click', () => {
        socket.emit('siguienteRonda', { codigo: displayCodigoSala.textContent });
    });

    document.getElementById('btn-reinicio-total')?.addEventListener('click', () => {
        if (confirm("¿Reiniciar la base de datos? Se perderán todos los puntos.")) {
            socket.emit('reinicioTotal', { codigo: displayCodigoSala.textContent });
        }
    });

    document.getElementById('btn-actualizar-salas')?.addEventListener('click', (e) => {
        socket.emit('pedirSalasPublicas');
        e.target.textContent = "⌛...";
        setTimeout(() => e.target.textContent = "🔄 Actualizar", 1000);
    });

    // ==========================================
    // RESPUESTAS SOCKET
    // ==========================================
    socket.on('listaSalasPublicas', (salas) => {
        const contenedor = document.getElementById('lista-salas-publicas');
        if (!contenedor) return;
        
        contenedor.innerHTML = '';
        if (salas.length === 0) {
            contenedor.innerHTML = '<p style="color: #666; font-style: italic; font-size: 0.8rem; text-align: center;">No hay misiones activas...</p>';
            return;
        }
        salas.forEach(sala => {
            const li = document.createElement('div');
            li.style.cssText = "background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.3); border-radius: 8px; padding: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;";
            li.innerHTML = `
                <div>
                    <span style="color: #d4af37; font-weight: bold; font-size: 1.1rem; text-transform: uppercase;">${sala.nombreSala}</span>
                    <div style="font-size: 0.7rem; color: #aaa; margin-top: 3px;">CÓDIGO: ${sala.codigo} • Agentes: ${sala.jugadores}/10</div>
                </div>
                <button class="btn-secundario" style="margin: 0; padding: 5px 12px; font-size: 0.7rem;">UNIRSE</button>
            `;
            li.querySelector('button').onclick = () => {
                const nombre = inputNombre ? inputNombre.value.trim() : "";
                if (!nombre) {
                    alert("Primero ingresa tu nombre de Agente arriba.");
                    if(inputNombre) inputNombre.focus();
                    return;
                }
                socket.emit('unirseSala', { nombre, codigo: sala.codigo });
            };
            contenedor.appendChild(li);
        });
    });

    socket.on('salaCreada', (datos) => {
        cambiarPantalla('pantalla-sala'); 
        if (displayCodigoSala) displayCodigoSala.textContent = datos.codigo;
        if (displayNombreSala) displayNombreSala.textContent = datos.nombreSala; 
        
        document.getElementById('btn-iniciar-partida').style.setProperty('display', 'block', 'important');
        document.getElementById('btn-reinicio-total').style.setProperty('display', 'block', 'important');
        document.getElementById('panel-configuracion').style.setProperty('display', 'block', 'important');
        document.getElementById('mensaje-espera').style.setProperty('display', 'none', 'important');
        
        if(checkPublica) checkPublica.checked = true;
        
        actualizarLista(datos.jugadores);
    });

    socket.on('unidoASala', (datos) => {
        cambiarPantalla('pantalla-sala');
        if (displayCodigoSala) displayCodigoSala.textContent = datos.codigo;
        if (displayNombreSala) displayNombreSala.textContent = datos.nombreSala; 
        
        document.getElementById('btn-iniciar-partida').style.setProperty('display', 'none', 'important');
        document.getElementById('btn-reinicio-total').style.setProperty('display', 'none', 'important');
        document.getElementById('panel-configuracion').style.setProperty('display', 'none', 'important');
        document.getElementById('mensaje-espera').style.setProperty('display', 'block', 'important');
        
        actualizarLista(datos.jugadores);
    });

    socket.on('errorSala', (msj) => alert(msj));

    socket.on('nuevoHost', () => {
        document.getElementById('btn-iniciar-partida').style.setProperty('display', 'block', 'important');
        document.getElementById('panel-configuracion').style.setProperty('display', 'block', 'important');
        document.getElementById('mensaje-espera').style.setProperty('display', 'none', 'important');
        alert("El Host anterior se desconectó. Ahora tú tienes el control.");
    });

    socket.on('rolAsignado', (datos) => {
        cambiarPantalla('pantalla-juego'); 
        
        // --- APAGAR LA MÚSICA DE FONDO AL INICIAR LA PARTIDA ---
        sonidos.intro.pause();
        sonidos.intro.currentTime = 0; 
        
        if (listaPalabrasTablero) listaPalabrasTablero.innerHTML = '';
        if (panelEscribir) panelEscribir.style.setProperty('display', 'block', 'important');
        
        iniciarReloj(datos.tiempo, document.getElementById('tiempo-restante'));
        const descripcionRol = document.getElementById('descripcion-rol');
        if (descripcionRol) {
            descripcionRol.textContent = datos.rol === 'Infiltrado' ? 'INFILTRADO' : datos.palabra;
            descripcionRol.style.color = datos.rol === 'Infiltrado' ? "#ff4d4d" : "#d4af37";
        }
    });

    socket.on('iniciarVotacion', (datos) => {
        cambiarPantalla('pantalla-votacion'); 
        if (gridVotacion) gridVotacion.innerHTML = '';
        
        votoConfirmado = false;
        const btnVoto = document.getElementById('btn-confirmar-voto');
        if (btnVoto) btnVoto.disabled = true;
        
        iniciarReloj(datos.tiempo, document.getElementById('tiempo-votacion'));
        
        datos.jugadores.forEach(jugador => {
            if (jugador.id === socket.id) return;
            const div = document.createElement('div');
            div.className = 'tarjeta-voto panel-cristal';
            div.style.cssText = "cursor: pointer; padding: 15px; text-align: center; transition: 0.3s; margin: 5px;";
            div.innerHTML = `
                <strong style="color: #d4af37;">${jugador.nombre}</strong><br>
                <small style="font-style: italic;">"${jugador.palabra}"</small>
                <div class="contenedor-votos-previos" id="votos-para-${jugador.id}" style="font-size: 0.7rem; margin-top: 5px;"></div>
            `;
            div.onclick = () => {
                if (votoConfirmado) return;
                document.querySelectorAll('.tarjeta-voto').forEach(t => t.style.borderColor = 'transparent');
                div.style.borderColor = '#d4af37';
                idVotoSeleccionado = jugador.id;
                if (btnVoto) btnVoto.disabled = false;
                socket.emit('votoPreliminar', { codigo: displayCodigoSala.textContent, sospechosoId: jugador.id });
            };
            if (gridVotacion) gridVotacion.appendChild(div);
        });
    });

    socket.on('mostrarResultados', (datosFinales) => {
        clearInterval(temporizadorVisual);
        if(!muteado && sonidos.revelar) { sonidos.revelar.currentTime = 0; sonidos.revelar.play().catch(()=>{}); }
        
        cambiarPantalla('pantalla-resultados'); 
        
        const nombreImpostorRevelado = document.getElementById('nombre-impostor-revelado');
        if (nombreImpostorRevelado) nombreImpostorRevelado.textContent = datosFinales.impostor;
        if (listaResultados) listaResultados.innerHTML = '';
        
        if (datosFinales.partidaTerminada && listaResultados) {
            const ganador = datosFinales.detalles[0];
            const podio = document.createElement('div');
            podio.style.cssText = "text-align: center; margin-bottom: 20px; border: 1px solid #d4af37; padding: 15px; border-radius: 10px; background: rgba(212,175,55,0.05);";
            podio.innerHTML = `
                <h1 style="color: #d4af37; font-family: 'Cinzel', serif; margin: 0;">🏆 GANADOR 🏆</h1>
                <h2 style="font-size: 2rem; color: #fff; margin: 5px 0;">${ganador.nombre}</h2>
                <p style="color: #d4af37; font-weight: bold; margin: 0;">Puntaje: ${ganador.puntosAcumulados} pts</p>
            `;
            listaResultados.appendChild(podio);
        }

        if (listaResultados) {
            datosFinales.detalles.forEach((d, index) => {
                if (datosFinales.partidaTerminada && index === 0) return;
                const li = document.createElement('li');
                li.style.cssText = "background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 8px; list-style: none;";
                li.innerHTML = `
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${index + 1}. ${d.nombre}</strong>
                        <span style="color: #d4af37;">${d.puntosAcumulados} pts</span>
                    </div>
                    <div style="color: #888; font-size: 0.75rem;">${d.razon}</div>
                `;
                listaResultados.appendChild(li);
            });
        }

        const btnIniciarPartida = document.getElementById('btn-iniciar-partida');
        const esHost = btnIniciarPartida && btnIniciarPartida.style.display === 'block';
        
        const btnSiguiente = document.getElementById('btn-siguiente-ronda');
        if (btnSiguiente) btnSiguiente.style.setProperty('display', (esHost && !datosFinales.partidaTerminada) ? 'block' : 'none', 'important');
        
        const btnReinicio = document.getElementById('btn-reinicio-total');
        if (btnReinicio) btnReinicio.style.setProperty('display', esHost ? 'block' : 'none', 'important');
        
        const msjEspera = document.getElementById('mensaje-espera-resultados');
        if (msjEspera) msjEspera.style.setProperty('display', esHost ? 'none' : 'block', 'important');
    });

    // --- REENCENDER MÚSICA AL REINICIAR LA SALA ---
    socket.on('partidaReiniciadaCompletamente', () => {
        cambiarPantalla('pantalla-sala');
        if (!muteado && volumenActual > 0) sonidos.intro.play().catch(()=>{});
    });

    socket.on('jugadoresActualizados', (jugadores) => actualizarLista(jugadores));

    socket.on('nuevaPalabraTablero', (palabra) => {
        if (!listaPalabrasTablero) return;
        const li = document.createElement('li');
        li.textContent = palabra;
        li.style.cssText = "padding: 5px 10px; background: rgba(255,255,255,0.1); border-radius: 5px; margin: 3px; display: inline-block;";
        listaPalabrasTablero.appendChild(li);
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
        if (!el) return;
        if (t <= 0) { el.textContent = "∞"; el.style.color = "#d4af37"; return; }
        
        el.style.color = "#d4af37"; 
        temporizadorVisual = setInterval(() => {
            t--;
            el.textContent = `00:${t < 10 ? '0'+t : t}`;
            
            if (t <= 10 && t > 0) {
                if(!muteado && sonidos.ticTac) sonidos.ticTac.play().catch(()=>{});
                el.style.color = "#ff4d4d";
            }

            if (t <= 0) {
                clearInterval(temporizadorVisual);
                if(!muteado && sonidos.alarma) sonidos.alarma.play().catch(()=>{});
            }
        }, 1000);
    }

    function actualizarLista(jugadores) {
        if (!listaNombres || !contadorJugadores) return;
        listaNombres.innerHTML = '';
        contadorJugadores.textContent = jugadores.length;
        jugadores.forEach(j => {
            const li = document.createElement('li');
            li.textContent = `• ${j.nombre}`;
            li.style.cssText = "list-style: none; padding: 5px 0; color: #fff;";
            listaNombres.appendChild(li);
        });
    }
});