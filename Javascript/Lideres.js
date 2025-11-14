// =============================
// 🌐 URLs globales
// =============================
const API_URL = "https://api-prueba-2-r35v.onrender.com";

let todasLasConsultas = [];
let idUsuario = localStorage.getItem('id_usuario');
let rolUsuario = localStorage.getItem('rol');
let nombreUsuario = localStorage.getItem("nombre_usuario");


// =============================
// 🔒 Seguridad de acceso
// =============================
if (!idUsuario || !rolUsuario) {
    window.location.href = "index.html";
} else if (rolUsuario !== "Lider") {
    window.location.href = "index.html";
} else {
    const nombreDiv = document.getElementById("nombreUsuario");

    if (nombreUsuario) {
        if (nombreDiv) nombreDiv.textContent = `Hola, ${nombreUsuario}`;
    } else {
        fetch(`${API_URL}/Lider/${idUsuario}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.Lider) {
                    const nombre = data.lider.nombre;
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
// 📥 Al cargar la página
// =============================
document.addEventListener("DOMContentLoaded", () => {
    obtener_consultas_lider();
    obtenerDocentes();
    obtener_programas();
    obtenerEstudiantes();
    registrarUsuario();
    obtener_modulos();
    cargarProgramas();

    document.getElementById("registro_programas").addEventListener("submit", e => {
        e.preventDefault();
        registrar_programa();
    });

    document.getElementById("registro_modulo").addEventListener("submit", e => {
        e.preventDefault();
        registrar_modulo();
    });
});


// =============================
// 📥 Consultas
// =============================
function obtener_consultas_lider() {
    fetch(`${API_URL}/consultas_lider`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                todasLasConsultas = data.consultas;
                actualizarTablaConsultas(todasLasConsultas);
            }
        })
        .catch(err => console.error("Error:", err));
}

function obtenerConsultasFiltradas() {
    const fecha = document.getElementById("buscarFecha").value;
    const hora = document.getElementById("buscarHora").value;
    const mes = document.getElementById("buscarMes").value;
    const profesor = document.getElementById("buscarProfesor").value;
    const estudiante = document.getElementById("buscarEstudiante").value;

    let filtradas = [...todasLasConsultas];

    if (fecha) filtradas = filtradas.filter(c => c.fecha === fecha);
    if (hora) filtradas = filtradas.filter(c => c.hora === hora);
    if (mes) filtradas = filtradas.filter(c => new Date(c.fecha).getMonth() + 1 === parseInt(mes));
    if (profesor) filtradas = filtradas.filter(c => String(c.id_docente) === profesor);
    if (estudiante) filtradas = filtradas.filter(c => String(c.id_estudiante) === estudiante);

    let nombre_docente = "";
    if (profesor) {
        const select = document.getElementById("buscarProfesor");
        nombre_docente = select.options[select.selectedIndex].textContent;
        localStorage.setItem("nombre_docente", nombre_docente);
    } else {
        localStorage.removeItem("nombre_docente");
    }

    localStorage.setItem("consultas_filtradas", JSON.stringify(filtradas));
    actualizarTablaConsultas(filtradas);
}

function actualizarTablaConsultas(consultas) {
    const tbody = document.querySelector("#tablaConsultas tbody");
    tbody.innerHTML = "";

    if (!consultas || consultas.length === 0) {
        const fila = tbody.insertRow();
        const celda = fila.insertCell(0);
        celda.colSpan = 10;
        celda.textContent = "No hay consultas con esos filtros.";
        celda.style.textAlign = "center";
        return;
    }

    consultas.forEach(c => {
        const fila = tbody.insertRow();
        fila.insertCell(0).textContent = c.id;
        fila.insertCell(1).textContent = c.nombre_docente || "Sin nombre";
        fila.insertCell(2).textContent = c.nombre_estudiante || "Sin nombre";
        fila.insertCell(3).textContent = `${c.modulo} - ${c.nombre_modulo}`;
        fila.insertCell(4).textContent = c.tema || "N/A";
        fila.insertCell(5).textContent = c.nombre_programa || "N/A";
        fila.insertCell(6).textContent = c.fecha;
        fila.insertCell(7).textContent = c.hora;
        fila.insertCell(8).textContent = c.lugar_consulta || "N/A";

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
    });
}


// =============================
// 📥 Docentes
// =============================
function obtenerDocentes() {
    fetch(`${API_URL}/obtener_docentes`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                actualizarTablaDocentes(data.docentes);
                llenarSelectProfesores(data.docentes);
            }
        })
        .catch(err => console.error("Error:", err));
}

function actualizarTablaDocentes(docentes) {
    const tbody = document.querySelector("#tablaDocentes tbody");
    tbody.innerHTML = "";
    docentes.forEach(d => {
        const fila = tbody.insertRow();
        fila.insertCell(0).textContent = d.id;
        fila.insertCell(1).textContent = d.nombre;
    });
}

function llenarSelectProfesores(docentes) {
    const select = document.getElementById("buscarProfesor");
    select.innerHTML = '<option value="">Todos</option>';
    docentes.forEach(d => {
        const option = document.createElement("option");
        option.value = d.id;
        option.textContent = d.nombre;
        select.appendChild(option);
    });
}


// =============================
// 🔍 Filtrar estudiante
// =============================
function obtenerestudianteFiltrado() {
    const documento = document.getElementById("documento_usuario").value.trim();

    if (!documento) return alert("⚠️ Debes ingresar un número de documento.");

    fetch(`${API_URL}/obtener_estudiantes`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const estudiante = data.estudiantes.find(e => String(e.id) === documento);

                const tbody = document.querySelector("#tablaEstudiantes tbody");
                tbody.innerHTML = "";

                if (estudiante) {
                    const fila = tbody.insertRow();
                    fila.insertCell(0).textContent = estudiante.id;
                    fila.insertCell(1).textContent = estudiante.nombre;
                    fila.insertCell(2).textContent = estudiante.nombre_programa;
                } else {
                    const fila = tbody.insertRow();
                    const celda = fila.insertCell(0);
                    celda.colSpan = 3;
                    celda.textContent = "❌ No se encontró ningún estudiante.";
                    celda.style.textAlign = "center";
                }
            }
        });
}

function obtenerDocenteFiltrado() {
    const documento = document.getElementById("documento_docente").value.trim();

    if (!documento) return alert("⚠️ Debes ingresar un número de documento.");

    fetch(`${API_URL}/obtener_docentes`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const docente = data.docentes.find(e => String(e.id) === documento);

                const tbody = document.querySelector("#tablaDocentes tbody");
                tbody.innerHTML = "";

                if (docente) {
                    const fila = tbody.insertRow();
                    fila.insertCell(0).textContent = docente.id;
                    fila.insertCell(1).textContent = docente.nombre;
                    fila.insertCell(2).textContent = docente.nombre_programa;
                } else {
                    const fila = tbody.insertRow();
                    const celda = fila.insertCell(0);
                    celda.colSpan = 3;
                    celda.textContent = "❌ No se encontró ningún docente.";
                    celda.style.textAlign = "center";
                }
            }
        });
}


// =============================
// 📥 Estudiantes
// =============================
function obtenerEstudiantes() {
    fetch(`${API_URL}/obtener_estudiantes`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                actualizarTablaEstudiantes(data.estudiantes);
                llenarSelectEstudiantes(data.estudiantes);
            }
        })
        .catch(err => console.error("Error:", err));
}

function actualizarTablaEstudiantes(estudiantes) {
    const tbody = document.querySelector("#tablaEstudiantes tbody");
    tbody.innerHTML = "";
    estudiantes.forEach(e => {
        const fila = tbody.insertRow();
        fila.insertCell(0).textContent = e.id;
        fila.insertCell(1).textContent = e.nombre;
        fila.insertCell(2).textContent = e.nombre_programa;
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


// =============================
// 📥 Programas
// =============================
function obtener_programas() {
    fetch(`${API_URL}/programas`)
        .then(res => res.json())
        .then(data => {
            if (data.success) actualizarTablaprogramas(data.programas);
        })
        .catch(err => console.error("Error:", err));
}

function actualizarTablaprogramas(programas) {
    const tbody = document.querySelector("#tablaprogramas tbody");
    tbody.innerHTML = "";
    programas.forEach(p => {
        const fila = tbody.insertRow();
        fila.insertCell(0).textContent = p.id;
        fila.insertCell(1).textContent = p.nombre_programa;
    });
}

function registrar_programa() {
    const id = document.getElementById("idPrograma").value.trim();
    const nombre = document.getElementById("nombrePrograma").value.trim();

    if (!id || !nombre) return alert("Todos los campos son obligatorios.");

    fetch(`${API_URL}/programas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nombre })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                document.getElementById("registro_programas").reset();
                obtener_programas();
            } else alert("Error: " + data.message);
        });
}


// =============================
// 📥 Módulos
// =============================
function obtener_modulos() {
    fetch(`${API_URL}/modulos`)
        .then(res => res.json())
        .then(data => {
            if (data.success) actualizarTablamodulos(data.modulos);
        });
}

function registrar_modulo() {
    const id = document.getElementById("idModulo").value.trim();
    const nombre = document.getElementById("nombreModulo").value.trim();

    if (!id || !nombre) return alert("Todos los campos son obligatorios");

    fetch(`${API_URL}/modulos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nombre })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                document.getElementById("registro_modulo").reset();
                obtener_modulos();
            }
        });
}

function actualizarTablamodulos(modulos) {
    const tbody = document.querySelector("#tablamodulos tbody");
    tbody.innerHTML = "";
    modulos.forEach(m => {
        const fila = tbody.insertRow();
        fila.insertCell(0).textContent = m.id;
        fila.insertCell(1).textContent = m.nombre;
    });
}


// =============================
// 🧑‍🎓 Registrar usuario
// =============================
function registrarUsuario() {
    const form = document.getElementById("registroUsuarioForm");
    if (!form) return;

    const selectRol = document.getElementById("rolUsuario");
    const inputPrograma = document.getElementById("programaAcademico");

    if (selectRol && inputPrograma) {
        inputPrograma.value = "";
        inputPrograma.disabled = true;

        selectRol.addEventListener("change", function () {
            if (this.value === "Estudiante") {
                inputPrograma.disabled = false;
            } else {
                inputPrograma.value = "";
                inputPrograma.disabled = true;
            }
        });
    }

    form.addEventListener("submit", e => {
        e.preventDefault();

        const datos = {
            rol: form.rolUsuario.value.trim(),
            id: form.idUsuario.value.trim(),
            nombre: form.nombreUsuario.value.trim().replace(/\s{2,}/g, " "),
            id_programa: inputPrograma.value.trim(),
            contra: form.contraUsuario.value.replace(/\s+/g, "")
        };

        if (!datos.rol || !datos.id || !datos.nombre || !datos.contra)
            return alert("⚠️ Todos los campos son obligatorios.");

        const regexContra = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!regexContra.test(datos.contra)) {
            return alert("⚠️ La contraseña debe tener mínimo 8 caracteres y contener mayúscula, minúscula, número y carácter especial.");
        }

        if (datos.rol !== "Estudiante") datos.id_programa = "";

        fetch(`${API_URL}/registrar_usuario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Usuario registrado con éxito");

                    form.reset();
                    inputPrograma.disabled = true;

                    obtenerDocentes();
                    obtenerEstudiantes();
                    cargarProgramas();
                } else {
                    alert("Error: " + data.message);
                }
            });
    });

    const contraInput = document.getElementById("contraUsuario");
    if (contraInput) {
        contraInput.addEventListener("keydown", e => {
            if (e.key === " ") e.preventDefault();
        });
    }
}


// =============================
// 📚 Cargar Programas
// =============================
function cargarProgramas() {
    fetch(`${API_URL}/programas`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('programaAcademico');
                select.innerHTML = '<option value="">Seleccione un programa</option>';

                data.programas.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id;
                    option.textContent = p.nombre_programa;
                    select.appendChild(option);
                });
            }
        });
}

cargarProgramas();


// =============================
// ⚙️ Utilidades
// =============================
function openTab(evt, tabName) {
    document.querySelectorAll(".tabcontent").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tablink").forEach(btn => btn.classList.remove("active"));
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function exportarExcel() {
    let tabla = document.getElementById("tablaConsultas");
    let wb = XLSX.utils.table_to_book(tabla, { sheet: "Consultas" });
    XLSX.writeFile(wb, "Consultas.xlsx");
}

function exportarformato() {
    window.location.href = "formato.html";
}

function cerrarSesion() {
    localStorage.clear();
    window.location.href = "index.html";
}
