// =============================
// 🌐 URLs del proyecto
// =============================
const FRONTEND_URL = "https://m4rt1ng24.github.io/Consultas-iubv2/";
const API_URL = "https://api-prueba-2-r35v.onrender.com";

// =============================
// ⚙️ Configuración inicial
// =============================
let consultas = [];
const idUsuario = localStorage.getItem("id_usuario");
const rolUsuario = localStorage.getItem("rol");
let nombreUsuario = localStorage.getItem("nombre_usuario");
let signatureInstance = null;

// =============================
// 🔒 Seguridad de acceso
// =============================
if (!idUsuario || !rolUsuario) {
    alert("⚠️ Debes iniciar sesión para acceder.");
    window.location.href = FRONTEND_URL + "index.html";
} else if (rolUsuario !== "Estudiante") {
    alert("⚠️ No tienes permisos para acceder a esta sección.");
    window.location.href = FRONTEND_URL + "index.html";
} else {
    const nombreDiv = document.getElementById("nombreUsuario");
    if (nombreUsuario) {
        nombreDiv.textContent = `Hola, ${nombreUsuario}`;
    } else {
        fetch(`${API_URL}/estudiante/${idUsuario}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.estudiante) {
                    const nombre = data.estudiante.nombre;
                    localStorage.setItem("nombre_usuario", nombre);
                    nombreDiv.textContent = `Hola, ${nombre}`;
                } else {
                    console.warn("⚠️ No se encontró información del estudiante.");
                }
            })
            .catch(err => console.error("Error al obtener el nombre del estudiante:", err));
    }
}

// =============================
// 📥 Obtener consultas del estudiante
// =============================
function obtener_consultas_por_estudiante(id) {
    fetch(`${API_URL}/consultas_estudiante/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                consultas = data.consultas;
                actualizarTablaConsultas(consultas);
            } else {
                console.error("Error al cargar consultas:", data.message);
            }
        })
        .catch(error => {
            console.error("Error al conectar con el servidor:", error);
        });
}

// =============================
// 🔍 Filtro de consultas
// =============================
function obtenerConsultasFiltradas() {
    const fecha = document.getElementById("buscarFecha").value;
    const hora = document.getElementById("buscarHora").value;
    const mes = document.getElementById("buscarMes").value;
    const docente = document.getElementById("buscarDocente").value;

    let filtradas = [...consultas];

    if (fecha) filtradas = filtradas.filter(c => c.fecha === fecha);
    if (hora) filtradas = filtradas.filter(c => c.hora === hora);
    if (mes) filtradas = filtradas.filter(c => new Date(c.fecha).getMonth() + 1 == mes);
    if (docente) filtradas = filtradas.filter(c => String(c.id_docente) === docente);

    actualizarTablaConsultas(filtradas);
}

// =============================
// 🧾 Renderizar tabla
// =============================
function actualizarTablaConsultas(lista) {
    const tabla = document.querySelector("#tablaconsultas tbody");
    tabla.innerHTML = "";

    lista.forEach(consulta => {
        const fila = tabla.insertRow();
        fila.insertCell(0).textContent = consulta.id || "";
        fila.insertCell(1).textContent = consulta.nombre_estudiante || "";
        fila.insertCell(2).textContent = consulta.nombre_modulo || "";
        fila.insertCell(3).textContent = consulta.tema || "";
        fila.insertCell(4).textContent = consulta.lugar_consulta || "";
        fila.insertCell(5).textContent = consulta.fecha || "";
        fila.insertCell(6).textContent = consulta.hora || "";
        fila.insertCell(7).textContent = consulta.nombre_docente || "";

        const celdaFirmar = fila.insertCell(8);
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
        img.style.boxShadow = "0 0 3px rgba(39, 19, 19, 0.3)";
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
    });
}

// =============================
// ✍️ Modal de firma digital
// =============================
function abrirModalFirma(id_consulta) {
    const modal = document.getElementById("modalFirma");
    modal.style.display = "flex";
    const root = document.getElementById("rootFirma");
    root.innerHTML = "";

    signatureInstance = Signature(root, {
        value: [],
        width: 400,
        height: 200,
        instructions: "Firma aquí para confirmar la asistencia"
    });

    document.getElementById("btnConfirmarFirma").onclick = () => {
        const canvas = root.querySelector("canvas");
        const firmaDataURL = canvas.toDataURL("image/png");

        fetch(`${API_URL}/firmar_consulta/${id_consulta}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firma: firmaDataURL })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if (data.success) {
                    obtener_consultas_por_estudiante(idUsuario);
                    cerrarModalFirma();
                }
            })
            .catch(err => {
                console.error("Error al firmar:", err);
                alert("❌ Error al intentar firmar la consulta.");
            });
    };
}

function cerrarModalFirma() {
    document.getElementById("modalFirma").style.display = "none";
    signatureInstance = null;
}

// =============================
// 🚀 Cargar al abrir
// =============================
window.onload = () => {
    if (idUsuario) obtener_consultas_por_estudiante(idUsuario);
};
