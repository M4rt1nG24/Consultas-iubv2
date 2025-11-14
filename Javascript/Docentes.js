// =============================
// 🌐 URLs del proyecto
// =============================
const FRONTEND_URL = "https://m4rt1ng24.github.io/Consultas-iubv2/";
const API_URL = "https://api-prueba-2-r35v.onrender.com";

// =============================
// 🔒 Seguridad de acceso + Mostrar nombre del docente desde la DB
// =============================
const idDocente = localStorage.getItem("id_usuario");
const rolUsuario = localStorage.getItem("rol");
let nombreUsuario = localStorage.getItem("nombre_usuario");

if (!idDocente || !rolUsuario) {
  window.location.href = FRONTEND_URL + "index.html";
} else if (rolUsuario !== "Docente") {
  window.location.href = FRONTEND_URL + "index.html";
} else {
  const nombreDiv = document.getElementById("nombreDocente");
  if (nombreUsuario) {
    if (nombreDiv) nombreDiv.textContent = `Hola, ${nombreUsuario}`;
  } else {
    fetch(`${API_URL}/docente/${idDocente}`)
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

  let escaneoHecho = false; // 🟢 Evita repetición

  const lector = new Html5Qrcode("lectorQR");

  lector.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },

    qrCodeMessage => {

      if (escaneoHecho) return; // ⛔ Solo 1 lectura

      const documento = qrCodeMessage.replace(/^0+/, "");

      if (String(documento) === String(idEstudiante)) {

        escaneoHecho = true;

        fetch(`${API_URL}/firmar_consulta/${idConsulta}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firma: "Firmado por QR" })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("Consulta firmada con éxito");
            obtener_consultas_docente(idDocente);
          } else {
            alert(data.message || "No se pudo firmar");
          }
        })
        .catch(err => console.error("Error al firmar:", err))
        .finally(() => lector.stop());

      } else {
        escaneoHecho = true;
        alert("El QR no corresponde al estudiante");
        lector.stop();
      }
    },

    err => {} // ⛔ Evita spam de errores normales en consola

  ).catch(err => {
    console.error("Error al iniciar cámara:", err);
    alert("No se pudo acceder a la cámara:\n" + err);
  });
}




// Alias para compatibilidad con HTML
function abrirModalQR(idConsulta, idEstudiante) {
  document.getElementById("modalQR").style.display = "block";

  setTimeout(() => {
    iniciarEscaneo(idConsulta, idEstudiante);
  }, 300);
}


// =============================
// 📚 CARGAR MÓDULOS
// =============================
function cargarmodulos() {
  fetch(`${API_URL}/modulos`)
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById("buscar_modulo");
      if (!select) return;
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
  fetch(`${API_URL}/consultas_docente/${id_docente}`)
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
// 🔍 FILTRO DE CONSULTAS (por documento)
// =============================
function obtenerConsultasFiltradas() {
  const fecha = document.getElementById("buscarFecha")?.value || "";
  const hora = document.getElementById("buscarHora")?.value || "";
  const mes = document.getElementById("buscarMes")?.value || "";
  const documento = document.getElementById("buscarIdEstudiante")?.value || "";

  let filtradas = todasLasConsultas.filter(c => String(c.id_docente) === idDocente);

  if (fecha) filtradas = filtradas.filter(c => c.fecha === fecha);
  if (hora) filtradas = filtradas.filter(c => c.hora === hora);
  if (mes) filtradas = filtradas.filter(c => (new Date(c.fecha).getMonth() + 1) === parseInt(mes));
  if (documento) filtradas = filtradas.filter(c => String(c.id_estudiante) === documento);

  actualizarTablaConsultas(filtradas);
  localStorage.setItem("consultas_filtradas", JSON.stringify(filtradas));
  localStorage.setItem("nombre_docente", nombreUsuario);
}

// =============================
// 📊 TABLA DE CONSULTAS
// =============================
function actualizarTablaConsultas(consultas) {
  const tbody = document.querySelector("#tablaconsultas tbody");
  if (!tbody) return;
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
        celdaFirma.textContent = "⚠️ Formato no reconocido";
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




// =============================
// 🔹 Variables globales para edición
// =============================
let idConsultaEditar = null;

// =============================
// 🔹 Abrir modal de edición
// =============================
function abrirModalEdicion(id, fecha, hora) {
    idConsultaEditar = id;
    document.getElementById("idConsultaEditar").value = id;
    document.getElementById("nuevaFecha").value = fecha;
    document.getElementById("nuevaHora").value = hora;
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
async function actualizarConsultaBackend(fecha, hora,lugar_consulta,tema) {
    if (!idConsultaEditar) return { success: false, message: "ID de consulta no definido" };

    try {
        const response = await fetch(`https://api-prueba-2-r35v.onrender.com/editar_consulta/${idConsultaEditar}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fecha, hora,lugar_consulta,tema })
        });
        return await response.json();
    } catch (error) {
        console.error("Error de conexión:", error);
        return { success: false, message: "Error de conexión con el servidor" };
    }
}

// =============================
// 🔹 Guardar cambios al enviar formulario
// =============================
async function guardarEdicionConsulta(event) {
    event.preventDefault();

    const nuevaFecha = document.getElementById("nuevaFecha").value;
    const nuevaHora = document.getElementById("nuevaHora").value;
    const nuevoLugar = document.getElementById("nuevoLugar").value;
    const nuevoTema = document.getElementById("nuevoTema").value;


    const resultado = await actualizarConsultaBackend(nuevaFecha, nuevaHora,nuevoLugar,nuevoTema);

    if (resultado.success) {
        // Actualizar arreglo local y refrescar tabla
        const index = todasLasConsultas.findIndex(c => c.id === idConsultaEditar);
        if (index !== -1) {
            todasLasConsultas[index].fecha = nuevaFecha;
            todasLasConsultas[index].hora = nuevaHora;
            todasLasConsultas[index].lugar_consulta = nuevoLugar;
            todasLasConsultas[index].hora = nuevoTema;
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
                // 🛑 AÑADIR ESTA LÍNEA PARA GUARDAR LOS DATOS
                todasLassolicitudes = data.solicitudes; 
                actualizarTablaSolicitudes(todasLassolicitudes); // Usar el arreglo completo
            } else {
                todasLassolicitudes = []; // Limpiar si falla
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
    const estudiante = document.getElementById("buscarIdEstudianteSolicitud").value;

    // Antes:
    // let Solicitudes_filtradas = todasLassolicitudes.filter(c => String(c.id_docente) === idDocente); 
    
    // 💡 Corrección/Mejora: Si ya traes solo las del docente, usa el arreglo completo como inicio
    let Solicitudes_filtradas = [...todasLassolicitudes]; // Inicia con una copia del arreglo completo

    if (fecha) Solicitudes_filtradas = Solicitudes_filtradas.filter(c => c.fecha === fecha);
    if (hora) Solicitudes_filtradas = Solicitudes_filtradas.filter(c => c.hora === hora);
    // Corrección para el filtro de mes: se recomienda usar la función parseInt dentro del filtro
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
// 🧭 TABS (funcional)
// =============================
function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  const tablinks = document.getElementsByClassName("tablink");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }

  // Mostrar la pestaña seleccionada
  document.getElementById(tabName).style.display = "block";

  // Activar el botón actual
  evt.currentTarget.classList.add("active");
}


function cerrarSesion() {
    localStorage.clear();
    window.location.href = "index.html";
}

function exportarformato() {
    window.location.href = "formato.html";
}






// =============================
// 🚀 INICIO AUTOMÁTICO
// =============================
document.addEventListener("DOMContentLoaded", () => {
  cargarmodulos();
  obtener_consultas_docente(idDocente);
  obtener_solicitudes_docente(idDocente);
  registrarConsulta();
});
