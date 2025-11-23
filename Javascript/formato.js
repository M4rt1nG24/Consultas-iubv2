// =============================
// 🔒 Seguridad de acceso
// =============================
const idUsuario = localStorage.getItem("id_usuario");
const rolUsuario = localStorage.getItem("rol");
const nombreDocente = localStorage.getItem("nombre_docente") || "Sin docente seleccionado";

if (!idUsuario || !rolUsuario) {
  alert("⚠️ Debes iniciar sesión para acceder.");
  window.location.href = "index.html";
} else if (rolUsuario !== "Docente" && rolUsuario !== "Lider") {
  alert("⚠️ No tienes permisos para acceder a esta sección.");
  window.location.href = "index.html";
}

// =============================
// 📋 CARGAR LISTADO DE ASISTENCIA
// =============================
let listaAsistencia = [];

function cargarAsistenciaFiltrada() {
  const filtradas = JSON.parse(localStorage.getItem("consultas_filtradas")) || [];
  listaAsistencia = filtradas;
  mostrarAsistencia(listaAsistencia);
}

// =============================
// 📊 MOSTRAR DATOS EN LA TABLA
// =============================
function mostrarAsistencia(asistencias) {
  const tbody = document.querySelector("#tabla_estudiantes");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!asistencias.length) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 11;
    celda.textContent = "⚠️ No hay registros filtrados para mostrar.";
    celda.style.textAlign = "center";
    fila.appendChild(celda);
    tbody.appendChild(fila);
    return;
  }

  asistencias.forEach((a, index) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${index + 1}</td>
      <td>${a.nombre_estudiante || "Sin nombre"}</td>
      <td>${a.tipo_documento || "CC"}</td>
      <td>${a.id_estudiante || "—"}</td>
      <td>${a.tema || "—"}</td>
      <td>${a.nombre_programa || "N/A"}</td>
      <td>${a.nombre_modulo || a.modulo || "Sin módulo"}</td>
      <td>${a.lugar_consulta || "—"}</td>
      <td>${a.fecha || "—"}</td>
      <td>${a.hora || "—"}</td>
    `;

    const celdaFirma = fila.insertCell(10);
    const firmaValor = a.firma ? a.firma.trim() : "";

    if (firmaValor && firmaValor !== "No Firmado") {
      if (firmaValor.toLowerCase().includes("firmado por qr")) {
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

    tbody.appendChild(fila);
  });
}

// =============================
// 🧾 Mostrar programa en encabezado
// =============================
const inputPrograma = document.getElementById("programa_academico");
const programaImpreso = document.getElementById("programa_impreso");

if (inputPrograma) {
  inputPrograma.addEventListener("input", () => {
    if (programaImpreso)
      programaImpreso.textContent = inputPrograma.value.trim()
        ? `Programa: ${inputPrograma.value.trim()}`
        : "";
  });
}

// =============================
// 📸 Funciones de Firma
// =============================
function mostrarImagenFirma(event, tipo) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.getElementById(`imagenFirma_${tipo}`);
      img.src = e.target.result;
      img.style.display = "block";
      document.getElementById(`lineaFirma_${tipo}`).style.display = "none";
    };
    reader.readAsDataURL(file);
  }
}

function abrirSelectorFirma(tipo) {
  document.getElementById(`inputFirma_${tipo}`).click();
}

const API_URL = "https://fvbpfuy3pd.us-east-2.awsapprunner.com";

// Obtener el ID del docente desde localStorage
const idDocente = localStorage.getItem("id_usuario");

// Función para obtener el nombre del docente y colocarlo en el formato
function cargarNombreDocente() {
    if (!idDocente) {
        console.warn("No se encontró el ID del docente.");
        return;
    }

    fetch(`${API_URL}/docente/${idDocente}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.docente) {

                // Nombre recibido desde la BD
                const nombre = data.nombre;

                // Guardar en localStorage por si se requiere nuevamente
                localStorage.setItem("nombre_docente_formato", nombre);

                // Colocar el nombre en el formato (cambia el ID según tu HTML)
                const campoNombreFormato = document.getElementById("nombreDocenteFormato");

                if (campoNombreFormato) {
                    campoNombreFormato.textContent = nombre;
                }

            } else {
                console.warn("No se encontró información del docente.");
            }
        })
        .catch(err => console.error("Error al obtener nombre del docente:", err));
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", cargarNombreDocente);

// ================================
// 💾 GUARDAR TODO EL HTML COMO PDF + GUARDAR EN BD
// ================================
async function guardarReporte() {
  const nombreReporte = prompt("Ingrese el nombre del reporte:");
  if (!nombreReporte) {
    alert("Debe ingresar un nombre para el reporte.");
    return;
  }

  const idUsuario = localStorage.getItem("id_usuario");
  if (!idUsuario) {
    alert("No se encontró el ID del usuario. Por favor inicie sesión.");
    return;
  }

  // 📸 Capturar TODO el body del HTML
  const contenido = document.body;

  // Ocultar botones durante la captura
  const botones = contenido.querySelectorAll("button");
  botones.forEach(btn => (btn.style.visibility = "hidden"));

  // Generar imagen del documento
  const canvas = await html2canvas(contenido, {
    scale: 2,
    useCORS: true,
    scrollX: 0,
    scrollY: -window.scrollY
  });

  // Restaurar visibilidad de los botones
  botones.forEach(btn => (btn.style.visibility = "visible"));

  const imgData = canvas.toDataURL("image/png");

  // Crear PDF con jsPDF
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "pt", "a4");

  const imgWidth = 550;
  const pageHeight = 780;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 25, position + 20, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Si el contenido ocupa más de una página
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 25, position + 20, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // Convertir a base64
  const pdfBase64 = pdf.output("datauristring").split(",")[1];

  // 📤 Enviar al backend
  const datos = {
    id_usuario: idUsuario,
    nombre_reporte: nombreReporte,
    archivo_pdf: pdfBase64,
  };

  try {
    const respuesta = await fetch("https://fvbpfuy3pd.us-east-2.awsapprunner.com/guardar_reporte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    const resultado = await respuesta.json();
    if (respuesta.ok) {
      alert("✅ Reporte completo guardado correctamente.");
    } else {
      alert("❌ Error al guardar el reporte: " + resultado.message);
    }
  } catch (error) {
    console.error(error);
    alert("⚠️ Ocurrió un error al conectar con el servidor.");
  }
}


// =============================
// 🖨️ Repetir observaciones y programa en impresión
// =============================
window.addEventListener("beforeprint", () => {
  const observacionTextarea = document.querySelector(".columna-derecha textarea");
  const textoObservacion = observacionTextarea ? observacionTextarea.value.trim() : "";

  if (textoObservacion) {
    document.querySelectorAll(".columna-derecha").forEach((col) => {
      col.innerHTML = `
        <h4>OBSERVACIONES</h4>
        <div class="texto-obs" style="white-space: pre-wrap; font-size:9px;">${textoObservacion}</div>
      `;
    });
  }

  const inputPrograma = document.getElementById("programa_academico");
  const textoPrograma = inputPrograma ? inputPrograma.value.trim() : "";

  if (textoPrograma) {
    document.querySelectorAll(".bloque-pequeno input#programa_academico").forEach((el) => {
      const parent = el.parentElement;
      parent.innerHTML = `<span style="font-size:9px; font-weight:bold;">Programa: ${textoPrograma}</span>`;
    });
  }
});

// =============================
// Mostrar nombre docente y cargar tabla
// =============================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("nombre_docente").textContent = nombreDocente;
  cargarAsistenciaFiltrada();
});
