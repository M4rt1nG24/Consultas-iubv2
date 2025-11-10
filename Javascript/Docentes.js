// ===============================
// 🔹 VARIABLES GLOBALES
// ===============================
let todasLasConsultas = [];
let todasLasSolicitudes = [];
const idDocente = localStorage.getItem("id_docente");
const API_URL = "https://api-prueba-2-r35v.onrender.com"; // 🔸 Reemplaza con tu endpoint real

// ===============================
// 🔹 FUNCIONES PRINCIPALES
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  registrarConsulta();
  cargarmodulos();
  obtener_consultas_docente(idDocente);
  obtener_solicitudes_docente(idDocente);
  mostrarNombreDocente();
});

// ===============================
// 🔹 MOSTRAR NOMBRE DEL DOCENTE
// ===============================
function mostrarNombreDocente() {
  const nombre = localStorage.getItem("nombre_docente");
  if (nombre) document.getElementById("nombreDocente").textContent = nombre;
}

// ===============================
// 🔹 CERRAR SESIÓN
// ===============================
function cerrarSesion() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ===============================
// 🔹 CAMBIO DE TABS
// ===============================
function openTab(evt, tabName) {
  const contents = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < contents.length; i++) contents[i].style.display = "none";

  const links = document.getElementsByClassName("tablink");
  for (let i = 0; i < links.length; i++) links[i].classList.remove("active");

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.classList.add("active");
}

// ===============================
// 🔹 CARGAR MÓDULOS
// ===============================
function cargarmodulos() {
  fetch(`${API_URL}/modulos`)
    .then(res => res.json())
    .then(modulos => {
      const select = document.getElementById("buscar_modulo");
      select.innerHTML = '<option value="">Seleccione un módulo</option>';
      modulos.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id_modulo;
        opt.textContent = m.nombre;
        select.appendChild(opt);
      });
    })
    .catch(err => console.error("Error cargando módulos:", err));
}

// ===============================
// 🔹 OBTENER CONSULTAS DEL DOCENTE
// ===============================
function obtener_consultas_docente(idDocente) {
  fetch(`${API_URL}/consultas/${idDocente}`)
    .then(res => res.json())
    .then(data => {
      todasLasConsultas = data;
      mostrarConsultas(data);
    })
    .catch(err => console.error("Error obteniendo consultas:", err));
}

function mostrarConsultas(consultas) {
  const tbody = document.querySelector("#tablaconsultas tbody");
  tbody.innerHTML = "";
  consultas.forEach(c => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${c.id_consulta}</td>
      <td>${c.nombre_estudiante}</td>
      <td>${c.id_estudiante}</td>
      <td>${c.modulo}</td>
      <td>${c.tema}</td>
      <td>${c.programa}</td>
      <td>${c.hora}</td>
      <td>${c.fecha}</td>
      <td>${c.lugar}</td>
      <td>${c.firma ? "✅" : "❌"}</td>
      <td>
        <button onclick="abrirModalEdicion(${c.id_consulta})">✏️</button>
        <button onclick="eliminarConsulta(${c.id_consulta})">🗑️</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

// ===============================
// 🔹 FILTRAR CONSULTAS
// ===============================
function obtenerConsultasFiltradas() {
  const fecha = document.getElementById("buscarFecha").value;
  const hora = document.getElementById("buscarHora").value;
  const mes = document.getElementById("buscarMes").value;
  const documento = document.getElementById("buscarDocumento").value;

  let filtradas = [...todasLasConsultas];

  if (fecha) filtradas = filtradas.filter(c => c.fecha === fecha);
  if (hora) filtradas = filtradas.filter(c => c.hora === hora);
  if (mes) filtradas = filtradas.filter(c => new Date(c.fecha).getMonth() + 1 == mes);
  if (documento)
    filtradas = filtradas.filter(c =>
      String(c.id_estudiante)?.toLowerCase().includes(documento.toLowerCase())
    );

  mostrarConsultas(filtradas);
}

// ===============================
// 🔹 REGISTRAR CONSULTA
// ===============================
function registrarConsulta() {
  document.getElementById("consultaForm").addEventListener("submit", e => {
    e.preventDefault();
    const datos = {
      id_estudiante: document.getElementById("numeroDocumentoEstudiante").value,
      id_modulo: document.getElementById("buscar_modulo").value,
      tema: document.getElementById("temaConsulta").value,
      fecha: document.getElementById("fechaConsulta").value,
      hora: document.getElementById("horaConsulta").value,
      lugar: document.getElementById("Lugar_consulta").value,
      id_docente: idDocente
    };

    fetch(`${API_URL}/registrar_consulta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    })
      .then(res => res.json())
      .then(respuesta => {
        alert(respuesta.message || "Consulta registrada");
        obtener_consultas_docente(idDocente);
      })
      .catch(err => console.error("Error registrando consulta:", err));
  });
}

// ===============================
// 🔹 EDITAR CONSULTA
// ===============================
function abrirModalEdicion(id) {
  const consulta = todasLasConsultas.find(c => c.id_consulta == id);
  if (!consulta) return;

  document.getElementById("idConsultaEditar").value = id;
  document.getElementById("nuevaFecha").value = consulta.fecha;
  document.getElementById("nuevaHora").value = consulta.hora;
  document.getElementById("nuevoTema").value = consulta.tema;
  document.getElementById("nuevoLugar").value = consulta.lugar;

  document.getElementById("modalEditar").style.display = "flex";
}

function cerrarModalEdicion() {
  document.getElementById("modalEditar").style.display = "none";
}

document.getElementById("formEditarConsulta").addEventListener("submit", e => {
  e.preventDefault();

  const id = document.getElementById("idConsultaEditar").value;
  const datos = {
    fecha: document.getElementById("nuevaFecha").value,
    hora: document.getElementById("nuevaHora").value,
    tema: document.getElementById("nuevoTema").value,
    lugar: document.getElementById("nuevoLugar").value
  };

  fetch(`${API_URL}/editar_consulta/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  })
    .then(res => res.json())
    .then(respuesta => {
      alert(respuesta.message || "Consulta actualizada");
      cerrarModalEdicion();
      obtener_consultas_docente(idDocente);
    })
    .catch(err => console.error("Error editando consulta:", err));
});

// ===============================
// 🔹 ELIMINAR CONSULTA
// ===============================
function eliminarConsulta(id) {
  if (!confirm("¿Seguro que deseas eliminar esta consulta?")) return;

  fetch(`${API_URL}/eliminar_consulta/${id}`, { method: "DELETE" })
    .then(res => res.json())
    .then(respuesta => {
      alert(respuesta.message || "Consulta eliminada");
      obtener_consultas_docente(idDocente);
    })
    .catch(err => console.error("Error eliminando consulta:", err));
}

// ===============================
// 🔹 SOLICITUDES DE CONSULTAS
// ===============================
function obtener_solicitudes_docente(idDocente) {
  fetch(`${API_URL}/solicitudes/${idDocente}`)
    .then(res => res.json())
    .then(data => {
      todasLasSolicitudes = data;
      mostrarSolicitudes(data);
    })
    .catch(err => console.error("Error obteniendo solicitudes:", err));
}

function mostrarSolicitudes(solicitudes) {
  const tbody = document.querySelector("#tablaSolicitudes tbody");
  tbody.innerHTML = "";
  solicitudes.forEach(c => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${c.id_solicitud}</td>
      <td>${c.nombre_estudiante}</td>
      <td>${c.programa}</td>
      <td>${c.modulo}</td>
      <td>${c.tema}</td>
      <td>${c.fecha}</td>
      <td>${c.hora}</td>
      <td>${c.lugar}</td>
      <td>${c.estado}</td>
      <td><button onclick="aceptarSolicitud(${c.id_solicitud})">✅ Aceptar</button></td>
    `;
    tbody.appendChild(fila);
  });
}

// ===============================
// 🔹 FILTRAR SOLICITUDES
// ===============================
function obtenerSolicitudesFiltradas() {
  const fecha = document.getElementById("buscarFechaSolicitud").value;
  const hora = document.getElementById("buscarHoraSolicitud").value;
  const mes = document.getElementById("buscarMesSolicitud").value;
  const documento = document.getElementById("buscarDocumentoSolicitud").value;

  let filtradas = [...todasLasSolicitudes];

  if (fecha) filtradas = filtradas.filter(c => c.fecha === fecha);
  if (hora) filtradas = filtradas.filter(c => c.hora === hora);
  if (mes) filtradas = filtradas.filter(c => new Date(c.fecha).getMonth() + 1 == mes);
  if (documento)
    filtradas = filtradas.filter(c =>
      String(c.id_estudiante)?.toLowerCase().includes(documento.toLowerCase())
    );

  mostrarSolicitudes(filtradas);
}

// ===============================
// 🔹 ACEPTAR SOLICITUD
// ===============================
function aceptarSolicitud(idSolicitud) {
  fetch(`${API_URL}/aceptar_solicitud/${idSolicitud}`, { method: "PUT" })
    .then(res => res.json())
    .then(respuesta => {
      alert(respuesta.message || "Solicitud aceptada");
      obtener_solicitudes_docente(idDocente);
    })
    .catch(err => console.error("Error aceptando solicitud:", err));
}

// ===============================
// 🔹 EXPORTAR A EXCEL
// ===============================
function exportarExcel() {
  const wb = XLSX.utils.table_to_book(document.getElementById("tablaconsultas"), { sheet: "Consultas" });
  XLSX.writeFile(wb, "consultas_docente.xlsx");
}

// ===============================
// 🔹 EXPORTAR A FORMATO (PDF/HTML)
// ===============================
function exportarformato() {
  window.open("formato.html", "_blank");
}
