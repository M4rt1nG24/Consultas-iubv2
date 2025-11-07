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
// 📋 CARGAR LISTADO DE ASISTENCIA (FILTRADO)
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
  const tbody = document.querySelector("tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Si no hay registros
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

  // Renderizar filas
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
        celdaFirma.style.textAlign = "center";

      // Caso 2: Firma en formato imagen Base64
      } else if (firmaValor.startsWith("data:image")) {
        const img = document.createElement("img");
        img.src = firmaValor;
        img.alt = "Firma del estudiante";
        img.style.maxWidth = "100px";
        img.style.maxHeight = "50px";
        img.style.borderRadius = "4px";
        img.style.boxShadow = "0 0 3px rgba(0,0,0,0.3)";
        celdaFirma.appendChild(img);

      // Caso 3: Texto u otro valor desconocido
      } else {
        celdaFirma.textContent = "⚠️ Formato de firma no reconocido";
        celdaFirma.style.color = "orange";
        celdaFirma.style.textAlign = "center";
      }
    } else {
      // Caso sin firma
      celdaFirma.textContent = "❌ No Firmado";
      celdaFirma.style.color = "red";
      celdaFirma.style.fontWeight = "bold";
      celdaFirma.style.textAlign = "center";
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
      programaImpreso.textContent = inputPrograma.value.trim() ? `Programa: ${inputPrograma.value.trim()}` : "";
  });
}


// Guardar firma (solo en memoria, no en localStorage)
function guardarFirma() {
  const imagenFirma = canvas.toDataURL("image/png");
  const img = document.createElement("img");
  img.src = imagenFirma;
  img.style.maxWidth = "120px";
  img.style.maxHeight = "60px";
  img.style.display = "block";
  img.style.margin = "auto";

  if (tipoFirmaActual === "docente") {
    firmaDocenteData = imagenFirma;
    document.getElementById("firmaDocente").innerHTML = "";
    document.getElementById("firmaDocente").appendChild(img);
    const p = document.createElement("p");
    p.textContent = "Firma del Docente";
    p.style.fontSize = "9px";
    document.getElementById("firmaDocente").appendChild(p);
  } else {
    firmaDecanoData = imagenFirma;
    document.getElementById("firmaDecano").innerHTML = "";
    document.getElementById("firmaDecano").appendChild(img);
    const p = document.createElement("p");
    p.textContent = "Firma del Líder o Decano";
    p.style.fontSize = "9px";
    document.getElementById("firmaDecano").appendChild(p);
  }

  cerrarModal();
}



// =============================
// Repetir firmas en la impresión
// =============================
window.addEventListener("beforeprint", () => {
  if (firmaDocenteData) {
    document.querySelectorAll("#firmaDocente").forEach(el => {
      el.innerHTML = `<img src="${firmaDocenteData}" style="max-width:120px;max-height:60px;display:block;margin:auto;"><p>Firma del Docente</p>`;
    });
  }
  if (firmaDecanoData) {
    document.querySelectorAll("#firmaDecano").forEach(el => {
      el.innerHTML = `<img src="${firmaDecanoData}" style="max-width:120px;max-height:60px;display:block;margin:auto;"><p>Firma del Líder o Decano</p>`;
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

// Función para previsualizar la firma seleccionada (imagen)
    function mostrarImagenFirma(event, tipo) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = document.getElementById(`imagenFirma_${tipo}`);
          img.src = e.target.result;
          img.style.display = "block";
          document.getElementById(`lineaFirma_${tipo}`).style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    }

    // Función para abrir el selector de archivo (simula clic oculto)
    function abrirSelectorFirma(tipo) {
      document.getElementById(`inputFirma_${tipo}`).click();
    }
  // ================================
  // GUARDAR REPORTE EN BASE DE DATOS Y PDF
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

    // 🔹 Selecciona la tabla (sin el botón)
    const tabla = document.querySelector("tabla_estudiantes");
    const boton = tabla.querySelector("button");
    boton.style.display = "none"; // ocultar antes de capturar

    // 🔹 Capturar la tabla como imagen con html2canvas
    const canvas = await html2canvas(tabla, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    // 🔹 Crear PDF con jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "a4");
    const imgWidth = 550;
    const pageHeight = 780;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 25, position + 20, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 25, position + 20, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 🔹 Convertir PDF a Base64
    const pdfBase64 = pdf.output("datauristring").split(",")[1];

    boton.style.display = "block"; // mostrar de nuevo

    // 🔹 Enviar datos al backend
    const datos = {
      id_usuario: idUsuario,
      nombre_reporte: nombreReporte,
      archivo_pdf: pdfBase64
    };

    try {
      const respuesta = await fetch("https://api-prueba-2-r35v.onrender.com/guardar_reporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });

      const resultado = await respuesta.json();
      if (respuesta.ok) {
        alert("✅ Reporte y PDF guardados correctamente.");
      } else {
        alert("❌ Error al guardar el reporte: " + resultado.message);
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Ocurrió un error al conectar con el servidor.");
    }
  }


// =============================
// 📝 Repetir observaciones al imprimir
// =============================
window.addEventListener("beforeprint", () => {
  const observacionTextarea = document.querySelector(".columna-derecha textarea");
  const textoObservacion = observacionTextarea ? observacionTextarea.value.trim() : "";

  if (textoObservacion) {
    document.querySelectorAll(".columna-derecha").forEach(col => {
      col.innerHTML = `
        <h4>OBSERVACIONES</h4>
        <div class="texto-obs" style="white-space: pre-wrap; font-size:9px;">${textoObservacion}</div>
      `;
    });
  }
});
// // =============================
// 🖨️ Repetir Programa Académico al imprimir
// =============================
window.addEventListener("beforeprint", () => {
  const inputPrograma = document.getElementById("programa_academico");
  const textoPrograma = inputPrograma ? inputPrograma.value.trim() : "";

  if (textoPrograma) {
    // Buscar todos los lugares donde quieras mostrar el programa al imprimir
    document.querySelectorAll(".bloque-pequeno input#programa_academico").forEach(el => {
      // reemplazar input por texto fijo para impresión
      const parent = el.parentElement;
      parent.innerHTML = `<span style="font-size:9px; font-weight:bold;">Programa: ${textoPrograma}</span>`;
    });
  }
});



