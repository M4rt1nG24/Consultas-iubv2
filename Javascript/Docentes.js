// =============================
// 🔒 Seguridad de acceso + Mostrar nombre del docente desde la DB
// =============================
const idDocente = localStorage.getItem("id_usuario");
const rolUsuario = localStorage.getItem("rol");
let nombreUsuario = localStorage.getItem("nombre_usuario");

// Validar acceso
if (!idDocente || !rolUsuario) {
    window.location.href = "index.html";
} else if (rolUsuario !== "Docente") {
    window.location.href = "index.html";
} else {
    // Mostrar nombre almacenado o traer desde backend
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
                } else {
                    console.warn("⚠️ No se encontró información del docente.");
                }
            })
            .catch(err => console.error("Error al obtener el nombre del docente:", err));
    }
}

// =============================
// 📷 ESCANEO QR
// =============================
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
                    .catch(err => console.error("Error al firmar:", err))
                    .finally(() => lector.stop());
            } else {
                alert("⚠️ El QR no corresponde al estudiante de esta consulta");
                lector.stop();
            }
        },
        errorMessage => {}
    );
}

// =============================
// 📚 CARGAR MÓDULOS
// =============================
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
        })
        .catch(error => console.error("Error al cargar módulos:", error));
}

// =============================
// 📋 CONSULTAS DEL DOCENTE
// =============================
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
        })
        .catch(error => console.error("Error al obtener consultas:", error));
}

// =============================
// 🔍 FILTRO DE CONSULTAS
// =============================
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

// =============================
// 🧑‍🎓 ESTUDIANTES DEL DOCENTE
// =============================
function obtenerEstudiantesDocente() {
    fetch(`https://api-prueba-2-r35v.onrender.com/estudiantes_docente/${idDocente}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) llenarSelectEstudiantes(data.estudiantes);
            else llenarSelectEstudiantes([]);
        })
        .catch(err => console.error("Error al traer estudiantes:", err));
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
        })
        .catch(err => console.error("Error al traer estudiantes:", err));
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


function obtenerSolicitudesFiltradas() {
    const fecha = document.getElementById("buscarFechaSolicitud").value;
    const hora = document.getElementById("buscarHoraSolicitud").value;
    const mes = document.getElementById("buscarMesSolicitud").value;
    const estudiante = document.getElementById("buscarEstudianteSolicitud").value;


    let Solicitudes_filtradas = todasLassolicitudes.filter(c => String(c.id_docente) === idDocente);

    if (fecha) Solicitudes_filtradas = Solicitudes_filtradas.filter(c => c.fecha === fecha);
    if (hora) Solicitudes_filtradas = Solicitudes_filtradas.filter(c => c.hora === hora);
    if (mes) Solicitudes_filtradas = Solicitudes_filtradas.filter(c => (new Date(c.fecha).getMonth() + 1) === parseInt(mes));
    if (estudiante) Solicitudes_filtradas = Solicitudes_filtradas.filter(c => String(c.id_estudiante) === estudiante);

    actualizarTablaSolicitudes(Solicitudes_filtradas);

    localStorage.setItem("Solicitudes_filtradas", JSON.stringify(Solicitudes_filtradas));
    localStorage.setItem("nombre_docente", nombreUsuario);
}


// =============================
// 📊 TABLA DE CONSULTAS
// =============================
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

    // =============================
    // 🖋️ Validación de firma
    // =============================
    const celdaFirma = fila.insertCell(9);
    const firmaValor = c.firma ? c.firma.trim() : "";

    if (firmaValor && firmaValor !== "No Firmado") {

      // Caso 1: Texto "Firmado por QR"
      if (firmaValor.toLowerCase() === "firmado por qr") {
        celdaFirma.textContent = "📱 Firmado por QR";
        celdaFirma.style.color = "#007bff";
        celdaFirma.style.fontWeight = "bold";
        celdaFirma.title = "Firma verificada mediante código QR";

      // Caso 2: Imagen base64 (firma manual)
      } else if (firmaValor.startsWith("data:image")) {
        const img = document.createElement("img");
        img.src = firmaValor;
        img.alt = "Firma del estudiante";
        img.style.maxWidth = "100px";
        img.style.maxHeight = "50px";
        img.style.borderRadius = "4px";
        img.style.boxShadow = "0 0 3px rgba(0,0,0,0.3)";
        celdaFirma.appendChild(img);

      // Caso 3: Valor desconocido o inválido
      } else {
        celdaFirma.textContent = "⚠️ Formato de firma no reconocido";
        celdaFirma.style.color = "orange";
      }

    } else {
      celdaFirma.textContent = "❌ No Firmado";
      celdaFirma.style.color = "red";
      celdaFirma.style.fontWeight = "bold";
    }

    // =============================
    // ⚙️ Botones de acción
    // =============================
    const celdaAcciones = fila.insertCell(10);
    celdaAcciones.classList.add("celda-acciones");

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "✏️ Editar";
    btnEditar.onclick = () => abrirModalEdicion(c.id, c.fecha, c.hora);
    celdaAcciones.appendChild(btnEditar);

    const btnEscanear = document.createElement("button");
    btnEscanear.textContent = "📷 Escanear";
    btnEscanear.onclick = () => iniciarEscaneo(c.id, c.id_estudiante);
    celdaAcciones.appendChild(btnEscanear);
  });
}




// =============================
// 🔹 Variables globales para edición
// =============================
let idConsultaEditar = null;

// =============================
// 🔹 Abrir modal de edición
// =============================
function abrirModalEdicion(id, fecha, hora, tema, lugar_consulta) {
  idConsultaEditar = id;
  document.getElementById("idConsultaEditar").value = id;
  document.getElementById("nuevaFecha").value = fecha;
  document.getElementById("nuevaHora").value = hora;
  document.getElementById("nuevoTema").value = tema;
  document.getElementById("nuevoLugar").value = lugar_consulta;
  document.getElementById("modalEditar").style.display = "flex";
}


// =============================
// 🔹 Cerrar modal
// =============================
function cerrarModalEdicion() {
    document.getElementById("modalEditar").style.display = "none";
    idConsultaEditar = null;
}

// =============================
// 🔹 Actualizar consulta en backend
// =============================
async function actualizarConsultaBackend(fecha, hora,lugar,tema) {
    if (!idConsultaEditar) return { success: false, message: "ID de consulta no definido" };

    try {
        const response = await fetch(`https://api-prueba-2-r35v.onrender.com/editar_consulta/${idConsultaEditar}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fecha, hora,lugar,tema })
        });
        return await response.json();
    } catch (error) {
        console.error("Error de conexión:", error);
        return { success: false, message: "Error de conexión con el servidor" };
    }
}
//buenas
// =============================
// 🔹 Guardar cambios al enviar formulario
// =============================
async function guardarEdicionConsulta(event) {
    event.preventDefault();

    const nuevaFecha = document.getElementById("nuevaFecha").value;
    const nuevaHora = document.getElementById("nuevaHora").value;
    const nuevoLugar = document.getElementById("nuevoLugar").value;
    const nuevoTema = document.getElementById("nuevoTema").value;

    const resultado = await actualizarConsultaBackend(nuevaFecha, nuevaHora);

    if (resultado.success) {
        // Actualizar arreglo local y refrescar tabla
        const index = todasLasConsultas.findIndex(c => c.id === idConsultaEditar);
        if (index !== -1) {
            todasLasConsultas[index].fecha = nuevaFecha;
            todasLasConsultas[index].hora = nuevaHora;
            todasLasConsultas[index].tema = nuevoTema;
            todasLasConsultas[index].lugar= nuevoLugar;
            actualizarTablaConsultas(todasLasConsultas);
        }
        alert("✅ Consulta actualizada correctamente.");
        cerrarModalEdicion();
    } else {
        alert("⚠️ Error al actualizar: " + (resultado.error || resultado.message));
    }
}

// =============================
// 🔹 Eventos
// =============================
// Enviar formulario
document.getElementById("formEditarConsulta").addEventListener("submit", guardarEdicionConsulta);

// Cerrar modal al hacer clic fuera
window.addEventListener("click", function(e) {
    const modal = document.getElementById("modalEditar");
    if (e.target === modal) cerrarModalEdicion();
});


// =============================
// 📅 REGISTRAR CONSULTA
// =============================
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
            .catch(err => {
                console.error("Error al registrar la consulta:", err);
                alert("Error de conexión con el servidor.");
            });
    });
}


// =============================
// 📨 SOLICITUDES DE CONSULTA
// =============================
function obtener_solicitudes_docente(id_docente) {
    fetch(`https://api-prueba-2-r35v.onrender.com/obtener_solicitudes_docente/${id_docente}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                todasLassolicitudes = data.solicitudes; 
                actualizarTablaSolicitudes(todasLassolicitudes); 
            } else {
                todasLassolicitudes = []; 
                actualizarTablaSolicitudes([]);
            }
        })
        .catch(err => {
            console.error("Error al obtener solicitudes:", err);
            todasLassolicitudes = [];
            actualizarTablaSolicitudes([]);
        });
}

// =============================
// 🔍 FILTRO DE SOLICITUDES
// =============================
function obtenerSolicitudesFiltradas() {
    const fecha = document.getElementById("buscarFechaSolicitud").value;
    const hora = document.getElementById("buscarHoraSolicitud").value;
    const mes = document.getElementById("buscarMesSolicitud").value;
    const estudiante = document.getElementById("buscarEstudianteSolicitud").value;

    let Solicitudes_filtradas = [...todasLassolicitudes];

    if (fecha) Solicitudes_filtradas = Solicitudes_filtradas.filter(c => c.fecha === fecha);
    if (hora) Solicitudes_filtradas = Solicitudes_filtradas.filter(c => c.hora === hora);
    if (mes) Solicitudes_filtradas = Solicitudes_filtradas.filter(c => (new Date(c.fecha).getMonth() + 1) === parseInt(mes));
    if (estudiante) Solicitudes_filtradas = Solicitudes_filtradas.filter(c => String(c.id_estudiante) === estudiante);

    actualizarTablaSolicitudes(Solicitudes_filtradas);

    localStorage.setItem("Solicitudes_filtradas", JSON.stringify(Solicitudes_filtradas));
    localStorage.setItem("nombre_docente", nombreUsuario);
}

function actualizarTablaSolicitudes(solicitudes) {
    const tbody = document.querySelector("#tablaSolicitudes tbody");
    tbody.innerHTML = "";

    if (solicitudes.length === 0) {
        const fila = tbody.insertRow();
        const celda = fila.insertCell(0);
        celda.colSpan = 9;
        celda.textContent = "⚠️ No hay solicitudes de consulta.";
        celda.style.textAlign = "center";
        return;
    }

    solicitudes.forEach(s => {
        const fila = tbody.insertRow();
        fila.insertCell(0).textContent = s.id;
        fila.insertCell(1).textContent = s.nombre_estudiante;
        fila.insertCell(2).textContent = s.nombre_programa || "N/A";
        fila.insertCell(3).textContent = s.nombre_modulo;
        fila.insertCell(4).textContent = s.tema;
        fila.insertCell(5).textContent = s.fecha;
        fila.insertCell(6).textContent = s.hora;
        fila.insertCell(7).textContent = s.lugar_consulta;
        fila.insertCell(8).textContent = s.estado;

        const celdaAcciones = fila.insertCell(9);
        if (s.estado === "Pendiente") {
            const btnAceptar = document.createElement("button");
            btnAceptar.textContent = "Aceptar ✅";
            btnAceptar.onclick = () => responderSolicitud(s.id, "Aceptar");

            const btnRechazar = document.createElement("button");
            btnRechazar.textContent = "Rechazar ❌";
            btnRechazar.onclick = () => responderSolicitud(s.id, "Rechazar");

            celdaAcciones.appendChild(btnAceptar);
            celdaAcciones.appendChild(btnRechazar);
        } else {
            celdaAcciones.textContent = "—";
        }
    });
}

async function responderSolicitud(id_solicitud, accion) {
    try {
        const res = await fetch("https://api-prueba-2-r35v.onrender.com/responder_solicitud", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_solicitud, accion })
        });
        const data = await res.json();
        alert(data.message);
        obtener_solicitudes_docente(idDocente);
        obtener_consultas_docente(idDocente);
    } catch (error) {
        console.error("Error:", error);
    }
}

// =============================
// 📤 EXPORTAR EXCEL
// =============================
function exportarExcel() {
    const tabla = document.getElementById("tablaconsultas");
    const copia = tabla.cloneNode(true);

    for (let fila of copia.rows) fila.deleteCell(-1);
    for (let fila of copia.rows) {
        const celdaFirma = fila.cells[9];
        if (celdaFirma && celdaFirma.querySelector("img")) {
            celdaFirma.textContent = celdaFirma.querySelector("img").src;
        }
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.table_to_sheet(copia);
    XLSX.utils.book_append_sheet(wb, ws, "Consultas");
    XLSX.writeFile(wb, "consultas.xlsx");
}

// =============================
// 🧭 TABS Y SESIÓN
// =============================
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) tabcontent[i].classList.remove("active");

    const tablinks = document.getElementsByClassName("tablink");
    for (let i = 0; i < tablinks.length; i++) tablinks[i].classList.remove("active");

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function cerrarSesion() {
    localStorage.clear();
    window.location.href = "index.html";
}

function exportarformato() {
    window.location.href = "formato.html";
}

let todosLosReportes = [];

// 🔹 Cargar los reportes guardados del docente
function cargarReportes() {
  const idUsuario = localStorage.getItem("id_usuario");
  if (!idUsuario) {
    alert("⚠️ No se encontró el ID del usuario. Inicie sesión primero.");
    return;
  }

  fetch(`https://api-prueba-2-r35v.onrender.com/reportes/${idUsuario}`)
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById("tbody_reportes");
      tbody.innerHTML = "";

      if (data.success && data.reportes.length > 0) {
        todosLosReportes = data.reportes;
        actualizarTablaReportes(todosLosReportes);
      } else {
        const fila = tbody.insertRow();
        const celda = fila.insertCell(0);
        celda.colSpan = 4;
        celda.textContent = "⚠️ No hay reportes disponibles.";
        celda.style.textAlign = "center";
      }
    })
    .catch(err => console.error("Error al cargar reportes:", err));
}

// 🔹 Mostrar los reportes en tabla
function actualizarTablaReportes(reportes) {
  const tbody = document.getElementById("tabla_reportes");
  tbody.innerHTML = "";

  reportes.forEach(r => {
    const fila = tbody.insertRow();
    fila.insertCell(0).textContent = r.id_reporte;
    fila.insertCell(1).textContent = r.nombre_reporte;
    fila.insertCell(2).textContent = r.fecha;

    // Botones de acción
    const celdaAcciones = fila.insertCell(3);
    celdaAcciones.classList.add("celda-acciones");

    const btnVer = document.createElement("button");
    btnVer.textContent = "👁️ Ver";
    btnVer.onclick = () => window.open(r.url_pdf, "_blank");
    celdaAcciones.appendChild(btnVer);

    const btnDescargar = document.createElement("button");
    btnDescargar.textContent = "⬇️ Descargar";
    btnDescargar.onclick = () => descargarPDF(r.url_pdf, r.nombre_reporte);
    celdaAcciones.appendChild(btnDescargar);
  });
}

// 🔹 Descargar PDF
function descargarPDF(url, nombre) {
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nombre}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 🔹 Filtrar reportes por fecha/mes
function filtrarReportes() {
  const fecha = document.getElementById("buscarFechaReporte").value;
  const mes = document.getElementById("buscarMesReporte").value;

  let filtrados = [...todosLosReportes];
  if (fecha) filtrados = filtrados.filter(r => r.fecha === fecha);
  if (mes) filtrados = filtrados.filter(r => (new Date(r.fecha).getMonth() + 1) === parseInt(mes));

  actualizarTablaReportes(filtrados);
}
/* ============================================================
   🌐 CONFIGURACIÓN GLOBAL
============================================================ */
const FRONTEND_URL = "https://m4rt1ng24.github.io/ConsultasIUB/";  // URL del frontend
const API_URL = "https://tu-api-flask.onrender.com"; // cambia por tu backend real (Render, Railway, etc.)

let todasLasConsultas = [];
let todasLasSolicitudes = [];

/* ============================================================
   🔐 AUTENTICACIÓN Y SESIÓN
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const nombreDocente = localStorage.getItem("nombre_docente");
  const idDocente = localStorage.getItem("id_docente");

  if (!nombreDocente || !idDocente) {
    alert("⚠️ Debes iniciar sesión nuevamente.");
    window.location.href = `${FRONTEND_URL}index.html`;
    return;
  }

  document.getElementById("nombreDocente").textContent = `👨‍🏫 ${nombreDocente}`;
  obtenerConsultas();
  obtenerSolicitudes();
  obtenerModulos();
});

/* ============================================================
   🚪 CERRAR SESIÓN
============================================================ */
function cerrarSesion() {
  localStorage.clear();
  window.location.href = `${FRONTEND_URL}index.html`;
}

/* ============================================================
   📑 CONSULTAS REGISTRADAS
============================================================ */
async function obtenerConsultas() {
  try {
    const idDocente = localStorage.getItem("id_docente");
    const response = await fetch(`${API_URL}/consultas?id_docente=${idDocente}`);
    const data = await response.json();
    todasLasConsultas = data;
    llenarTablaConsultas(data);
  } catch (error) {
    console.error("Error al obtener consultas:", error);
  }
}

function llenarTablaConsultas(consultas) {
  const tbody = document.querySelector("#tablaconsultas tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  consultas.forEach(c => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${c.id_consulta}</td>
      <td>${c.nombre_estudiante}</td>
      <td>${c.documento_estudiante}</td>
      <td>${c.modulo}</td>
      <td>${c.tema}</td>
      <td>${c.programa}</td>
      <td>${c.hora}</td>
      <td>${c.fecha}</td>
      <td>${c.lugar}</td>
      <td>${c.firma || "Sin firma"}</td>
      <td>
        <button onclick="abrirModalEdicion(${c.id_consulta})">✏️ Editar</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

/* ============================================================
   🔍 FILTRAR CONSULTAS POR DOCUMENTO
============================================================ */
function obtenerConsultasFiltradas() {
  const fecha = document.getElementById("buscarFecha")?.value;
  const hora = document.getElementById("buscarHora")?.value;
  const mes = document.getElementById("buscarMes")?.value;
  const documento = document.getElementById("buscarDocumento")?.value.trim();

  let filtradas = [...todasLasConsultas];

  if (fecha) filtradas = filtradas.filter(c => c.fecha === fecha);
  if (hora) filtradas = filtradas.filter(c => c.hora === hora);
  if (mes) filtradas = filtradas.filter(c => new Date(c.fecha).getMonth() + 1 == mes);
  if (documento) filtradas = filtradas.filter(c => c.documento_estudiante == documento);

  llenarTablaConsultas(filtradas);
}

/* ============================================================
   📩 SOLICITUDES DE CONSULTAS
============================================================ */
async function obtenerSolicitudes() {
  try {
    const idDocente = localStorage.getItem("id_docente");
    const response = await fetch(`${API_URL}/solicitudes?id_docente=${idDocente}`);
    const data = await response.json();
    todasLasSolicitudes = data;
    llenarTablaSolicitudes(data);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
  }
}

function llenarTablaSolicitudes(solicitudes) {
  const tbody = document.querySelector("#tablaSolicitudes tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  solicitudes.forEach(s => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${s.id_solicitud}</td>
      <td>${s.nombre_estudiante}</td>
      <td>${s.programa}</td>
      <td>${s.modulo}</td>
      <td>${s.tema}</td>
      <td>${s.fecha}</td>
      <td>${s.hora}</td>
      <td>${s.lugar}</td>
      <td>${s.estado}</td>
      <td>
        <button onclick="aceptarSolicitud(${s.id_solicitud})">✔️ Aceptar</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

/* ============================================================
   🧾 REGISTRO DE NUEVA CONSULTA
============================================================ */
document.getElementById("consultaForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const idDocente = localStorage.getItem("id_docente");

  const consulta = {
    documento_estudiante: document.getElementById("numeroDocumentoEstudiante").value,
    id_docente: idDocente,
    modulo: document.getElementById("buscar_modulo").value,
    tema: document.getElementById("temaConsulta").value,
    fecha: document.getElementById("fechaConsulta").value,
    hora: document.getElementById("horaConsulta").value,
    lugar: document.getElementById("Lugar_consulta").value
  };

  try {
    const res = await fetch(`${API_URL}/registrar_consulta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(consulta)
    });

    const data = await res.json();
    alert(data.message || "Consulta registrada correctamente ✅");
    obtenerConsultas();
    e.target.reset();
  } catch (error) {
    console.error("Error al registrar consulta:", error);
    alert("❌ Error al registrar la consulta.");
  }
});

/* ============================================================
   🧩 MÓDULOS
============================================================ */
async function obtenerModulos() {
  try {
    const res = await fetch(`${API_URL}/modulos`);
    const modulos = await res.json();
    const select = document.getElementById("buscar_modulo");
    if (!select) return;

    select.innerHTML = `<option value="">Seleccione un módulo</option>`;
    modulos.forEach(m => {
      const option = document.createElement("option");
      option.value = m.nombre_modulo;
      option.textContent = m.nombre_modulo;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error al obtener módulos:", error);
  }
}

/* ============================================================
   🧾 MODAL EDITAR CONSULTA
============================================================ */
function abrirModalEdicion(idConsulta) {
  document.getElementById("modalEditar").style.display = "block";
  document.getElementById("idConsultaEditar").value = idConsulta;
}

function cerrarModalEdicion() {
  document.getElementById("modalEditar").style.display = "none";
}

document.getElementById("formEditarConsulta")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const idConsulta = document.getElementById("idConsultaEditar").value;

  const datos = {
    nueva_fecha: document.getElementById("nuevaFecha").value,
    nueva_hora: document.getElementById("nuevaHora").value
  };

  try {
    const res = await fetch(`${API_URL}/editar_consulta/${idConsulta}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    const data = await res.json();
    alert(data.message || "Consulta actualizada correctamente ✅");
    cerrarModalEdicion();
    obtenerConsultas();
  } catch (error) {
    console.error("Error al editar consulta:", error);
  }
});

/* ============================================================
   📱 LECTOR QR (html5-qrcode)
============================================================ */
function iniciarLectorQR() {
  const contenedorQR = document.getElementById("lectorQR");
  if (!contenedorQR) {
    console.warn("Elemento con id='lectorQR' no encontrado en el HTML.");
    return;
  }

  const html5QrCode = new Html5Qrcode("lectorQR");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      document.getElementById("numeroDocumentoEstudiante").value = decodedText;
      html5QrCode.stop();
      alert("📸 Documento escaneado correctamente.");
    },
    (errorMessage) => { /* Ignorar errores menores */ }
  ).catch(err => console.error("Error al iniciar lector QR:", err));
}

/* ============================================================
   🧭 NAVEGACIÓN ENTRE SECCIONES
============================================================ */
function openTab(evt, tabName) {
  const tabcontent = document.querySelectorAll(".tabcontent");
  const tablinks = document.querySelectorAll(".tablink");

  tabcontent.forEach(tab => tab.classList.remove("active"));
  tablinks.forEach(tab => tab.classList.remove("active"));

  document.getElementById(tabName).classList.add("active");
  evt.currentTarget.classList.add("active");
}




// =============================
// 🚀 INICIO AUTOMÁTICO
// =============================
document.addEventListener("DOMContentLoaded", () => {
    registrarConsulta();
    cargarmodulos();
    obtener_consultas_docente(idDocente);
    obtenerEstudiantesDocente();
    obtenerEstudiantesDocentesolicitud();
    obtener_solicitudes_docente(idDocente);
});





