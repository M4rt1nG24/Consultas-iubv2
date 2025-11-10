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
  const lector = new Html5Qrcode("lectorQR");

  lector.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    qrCodeMessage => {
      const documento = qrCodeMessage.replace(/^0+/, "");
      if (String(documento) === String(idEstudiante)) {
        fetch(`${API_URL}/firmar_consulta/${idConsulta}`, {
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
    () => {}
  );
}

// Alias para compatibilidad con HTML
function iniciarLectorQR(idConsulta, idEstudiante) {
  iniciarEscaneo(idConsulta, idEstudiante);
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
// 🚀 INICIO AUTOMÁTICO
// =============================
document.addEventListener("DOMContentLoaded", () => {
  cargarmodulos();
  obtener_consultas_docente(idDocente);
});
