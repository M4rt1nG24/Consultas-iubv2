const idDocente = localStorage.getItem("id_usuario");
const rolUsuario = localStorage.getItem("rol");
let nombreUsuario = localStorage.getItem("nombre_usuario");

if (!idDocente || !rolUsuario) {
    window.location.href = "index.html";
} else if (rolUsuario !== "Docente") {
    window.location.href = "index.html";
} else {
    const nombreDiv = document.getElementById("nombreDocente");
    if (nombreUsuario) {
        if (nombreDiv) nombreDiv.textContent = `Hola, ${nombreUsuario}`;
    } else {
        fetch(`https://api-prueba-2-r35v.onrender.com/docente/${idDocente}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.docente) {
                    const nombre = data.nombre;
                    localStorage.setItem("nombre_usuario", nombre);
                    if (nombreDiv) nombreDiv.textContent = ` ${nombre}`;
                }
            });
    }
}

function iniciarEscaneo(idConsulta, idEstudiante) {
    const lector = new Html5Qrcode("lectorQR");
    lector.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        qrCodeMessage => {
            const documento = qrCodeMessage.replace(/^0+/, "");
            if (String(documento) === String(idEstudiante)) {
                fetch(`https://api-prueba-2-r35v.onrender.com/firmar_consulta/${idConsulta}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ firma: "Firmado por QR" })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            alert("✅ Consulta firmada con éxito");
                            obtener_consultas_docente(idDocente);
                        } else {
                            alert(data.message || "No se pudo firmar la consulta");
                        }
                    })
                    .finally(() => lector.stop());
            } else {
                alert("⚠️ El QR no corresponde al estudiante de esta consulta");
                lector.stop();
            }
        }
    );
}

function cargarmodulos() {
    fetch("https://api-prueba-2-r35v.onrender.com/modulos")
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById("buscar_modulo");
            select.innerHTML = '<option value="">Seleccione un módulo</option>';
            (data.modulos || []).forEach(p => {
                const option = document.createElement("option");
                option.value = p.id;
                option.textContent = `${p.id} - ${p.nombre}`;
                select.appendChild(option);
            });
        });
}

let todasLasConsultas = [];

function obtener_consultas_docente(id_docente) {
    fetch(`https://api-prueba-2-r35v.onrender.com/consultas_docente/${id_docente}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                todasLasConsultas = data.consultas;
                actualizarTablaConsultas(todasLasConsultas);
            } else {
                todasLasConsultas = [];
                actualizarTablaConsultas([]);
            }
        });
}

function obtenerConsultasFiltradas() {
    const fecha = document.getElementById("buscarFecha").value;
    const hora = document.getElementById("buscarHora").value;
    const mes = document.getElementById("buscarMes").value;
    const estudiante = document.getElementById("buscarEstudiante").value;

    let filtradas = todasLasConsultas.filter(c => String(c.id_docente) === idDocente);
    if (fecha) filtradas = filtradas.filter(c => c.fecha === fecha);
    if (hora) filtradas = filtradas.filter(c => c.hora === hora);
    if (mes) filtradas = filtradas.filter(c => (new Date(c.fecha).getMonth() + 1) === parseInt(mes));
    if (estudiante) filtradas = filtradas.filter(c => String(c.id_estudiante) === estudiante);
    actualizarTablaConsultas(filtradas);
    localStorage.setItem("consultas_filtradas", JSON.stringify(filtradas));
    localStorage.setItem("nombre_docente", nombreUsuario);
}

function obtenerEstudiantesDocente() {
    fetch(`https://api-prueba-2-r35v.onrender.com/estudiantes_docente/${idDocente}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) llenarSelectEstudiantes(data.estudiantes);
            else llenarSelectEstudiantes([]);
        });
}

function llenarSelectEstudiantes(estudiantes) {
    const select = document.getElementById("buscarEstudiante");
    select.innerHTML = '<option value="">Todos</option>';
    estudiantes.forEach(e => {
        const option = document.createElement("option");
        option.value = e.id;
        option.textContent = e.nombre;
        select.appendChild(option);
    });
}

function obtenerEstudiantesDocentesolicitud() {
    fetch(`https://api-prueba-2-r35v.onrender.com/estudiantes_docente_solicitud/${idDocente}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) llenarSelectEstudiantesolicitud(data.estudiantes);
            else llenarSelectEstudiantesolicitud([]);
        });
}

function llenarSelectEstudiantesolicitud(estudiantes) {
    const select = document.getElementById("buscarEstudianteSolicitud");
    select.innerHTML = '<option value="">Todos</option>';
    estudiantes.forEach(e => {
        const option = document.createElement("option");
        option.value = e.id;
        option.textContent = e.nombre;
        select.appendChild(option);
    });
}

let todasLassolicitudes = [];

function actualizarTablaConsultas(consultas) {
  const tbody = document.querySelector("#tablaconsultas tbody");
  tbody.innerHTML = "";
  if (!consultas || consultas.length === 0) {
    const fila = tbody.insertRow();
    const celda = fila.insertCell(0);
    celda.colSpan = 11;
    celda.textContent = "⚠️ No hay consultas con esos filtros.";
    celda.style.textAlign = "center";
    return;
  }
  consultas.forEach(c => {
    const fila = tbody.insertRow();
    fila.insertCell(0).textContent = c.id;
    fila.insertCell(1).textContent = c.nombre_estudiante || "Sin nombre";
    fila.insertCell(2).textContent = c.id_estudiante || "—";
    fila.insertCell(3).textContent = `${c.id_modulo || ""} - ${c.nombre_modulo || "Sin módulo"}`;
    fila.insertCell(4).textContent = c.tema || "—";
    fila.insertCell(5).textContent = c.nombre_programa || "N/A";
    fila.insertCell(6).textContent = c.hora || "—";
    fila.insertCell(7).textContent = c.fecha || "—";
    fila.insertCell(8).textContent = c.lugar_consulta || "—";
    const celdaFirma = fila.insertCell(9);
    const firmaValor = c.firma ? c.firma.trim() : "";
    if (firmaValor && firmaValor !== "No Firmado") {
      if (firmaValor.toLowerCase() === "firmado por qr") {
        celdaFirma.textContent = "📱 Firmado por QR";
        celdaFirma.style.color = "#007bff";
        celdaFirma.style.fontWeight = "bold";
      } else if (firmaValor.startsWith("data:image")) {
        const img = document.createElement("img");
        img.src = firmaValor;
        img.alt = "Firma del estudiante";
        img.style.maxWidth = "100px";
        img.style.maxHeight = "50px";
        img.style.borderRadius = "4px";
        img.style.boxShadow = "0 0 3px rgba(0,0,0,0.3)";
        celdaFirma.appendChild(img);
      } else {
        celdaFirma.textContent = "⚠️ Formato de firma no reconocido";
        celdaFirma.style.color = "orange";
      }
    } else {
      celdaFirma.textContent = "❌ No Firmado";
      celdaFirma.style.color = "red";
      celdaFirma.style.fontWeight = "bold";
    }
    const celdaAcciones = fila.insertCell(10);
    celdaAcciones.classList.add("celda-acciones");
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "✏️ Editar";
    btnEditar.onclick = () => abrirModalEdicion(c.id, c.fecha, c.hora, c.tema, c.lugar_consulta);
    celdaAcciones.appendChild(btnEditar);
    const btnEscanear = document.createElement("button");
    btnEscanear.textContent = "📷 Escanear";
    btnEscanear.onclick = () => iniciarEscaneo(c.id, c.id_estudiante);
    celdaAcciones.appendChild(btnEscanear);
  });
}

let idConsultaEditar = null;

function abrirModalEdicion(id, fecha, hora, tema, lugar_consulta) {
  idConsultaEditar = id;
  document.getElementById("idConsultaEditar").value = id;
  document.getElementById("nuevaFecha").value = fecha;
  document.getElementById("nuevaHora").value = hora;
  document.getElementById("nuevoTema").value = tema;
  document.getElementById("nuevoLugar").value = lugar_consulta;
  document.getElementById("modalEditar").style.display = "flex";
}

function cerrarModalEdicion() {
    document.getElementById("modalEditar").style.display = "none";
    idConsultaEditar = null;
}

async function actualizarConsultaBackend(fecha, hora, tema, lugar) {
    if (!idConsultaEditar) return { success: false, message: "ID de consulta no definido" };
    try {
        const response = await fetch(`https://api-prueba-2-r35v.onrender.com/editar_consulta/${idConsultaEditar}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fecha, hora, tema, lugar })
        });
        return await response.json();
    } catch {
        return { success: false, message: "Error de conexión con el servidor" };
    }
}

async function guardarEdicionConsulta(event) {
    event.preventDefault();
    const nuevaFecha = document.getElementById("nuevaFecha").value;
    const nuevaHora = document.getElementById("nuevaHora").value;
    const nuevoTema = document.getElementById("nuevoTema").value;
    const nuevoLugar = document.getElementById("nuevoLugar").value;
    const resultado = await actualizarConsultaBackend(nuevaFecha, nuevaHora, nuevoTema, nuevoLugar);
    if (resultado.success) {
        const index = todasLasConsultas.findIndex(c => c.id === idConsultaEditar);
        if (index !== -1) {
            todasLasConsultas[index].fecha = nuevaFecha;
            todasLasConsultas[index].hora = nuevaHora;
            todasLasConsultas[index].tema = nuevoTema;
            todasLasConsultas[index].lugar_consulta = nuevoLugar;
            actualizarTablaConsultas(todasLasConsultas);
        }
        alert("✅ Consulta actualizada correctamente.");
        cerrarModalEdicion();
    } else {
        alert("⚠️ Error al actualizar: " + (resultado.error || resultado.message));
    }
}

document.getElementById("formEditarConsulta").addEventListener("submit", guardarEdicionConsulta);

window.addEventListener("click", function(e) {
    const modal = document.getElementById("modalEditar");
    if (e.target === modal) cerrarModalEdicion();
});

function registrarConsulta() {
    document.getElementById("consultaForm").addEventListener("submit", e => {
        e.preventDefault();
        const fecha = document.getElementById("fechaConsulta").value;
        const hora = document.getElementById("horaConsulta").value;
        const fechaHoraIngresada = new Date(`${fecha}T${hora}`);
        const fechaHoraActual = new Date();
        if (fechaHoraIngresada < fechaHoraActual) {
            alert("⚠️ No puedes registrar una consulta en una fecha/hora pasada.");
            return;
        }
        const datos = {
            id_docente: idDocente,
            id_estudiante: document.getElementById("numeroDocumentoEstudiante").value,
            modulo: document.getElementById("buscar_modulo").value.trim(),
            tema: document.getElementById("temaConsulta").value.trim(),
            lugar_consulta: document.getElementById("Lugar_consulta").value.trim(),
            fecha,
            hora
        };
        fetch("https://api-prueba-2-r35v.onrender.com/registrar_consulta", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("✅ Consulta registrada exitosamente.");
                    document.getElementById("consultaForm").reset();
                    obtener_consultas_docente(idDocente);
                } else {
                    alert(data.message || "Error al registrar la consulta.");
                }
            })
            .catch(() => alert("Error de conexión con el servidor."));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    registrarConsulta();
    cargarmodulos();
    obtener_consultas_docente(idDocente);
    obtenerEstudiantesDocente();
    obtenerEstudiantesDocentesolicitud();
    obtener_solicitudes_docente(idDocente);
});
