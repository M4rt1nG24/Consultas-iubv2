document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('registroForm');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Obtener valores del formulario
        let nombre = document.getElementById('nombreCompleto').value.trim();
        let numeroDoc = document.getElementById('numeroDocumento').value.trim();
        let id_programa = document.getElementById('programaAcademico').value;
        let contra = document.getElementById('contra').value;

        // ======================================
        // 🧹 Eliminar espacios en la contraseña
        // ======================================
        contra = contra.replace(/\s+/g, "");

        // =============================
        // 🔒 Validaciones de seguridad
        // =============================

        // 1. Validar campos vacíos
        if (!nombre || !numeroDoc || !id_programa || !contra) {
            alert("⚠️ Todos los campos son obligatorios");
            return;
        }

        // 2. Validar nombre (solo letras y espacios, mínimo 3 caracteres)
        const regexNombre = /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]{8,50}$/;
        if (!regexNombre.test(nombre)) {
            alert("⚠️ El nombre solo puede contener letras y debe tener al menos 3 caracteres");
            return;
        }

        // 3. Validar número de documento (solo dígitos, entre 6 y 12)
        const regexDoc = /^[0-9]{6,12}$/;
        if (!regexDoc.test(numeroDoc)) {
            alert("⚠️ El número de documento debe contener entre 6 y 12 dígitos");
            return;
        }

        // 4. Validar contraseña segura
        // Debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
        const regexContra = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?{}[\]~]).{8,}$/;
        if (!regexContra.test(contra)) {
            alert("⚠️ La contraseña debe tener:\n- Mínimo 8 caracteres\n- Una mayúscula\n- Una minúscula\n- Un número\n- Un carácter especial\n(Ejemplo: MiClave@123)");
            return;
        }

        let datos = {
            id: numeroDoc,
            nombre: nombre,
            id_programa: id_programa,
            rol: "Estudiante",
            contra: contra
        };

        // =============================
        // 🚀 Enviar datos al backend
        // =============================
        fetch('https://4jdp777rcc.us-east-1.awsapprunner.com/registrar_usuario', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('✅ Estudiante registrado exitosamente');
                form.reset();
            } else {
                alert('⚠️ ' + (data.error || 'El estudiante ya está registrado'));
            }
        })
        .catch(error => {
            console.error('❌ Error al enviar la solicitud:', error);
            alert('⚠️ Error de conexión con el servidor');
        });
    });
});

// =============================
// 📚 Cargar Programas
// =============================
function cargarProgramas() {
    fetch('https://4jdp777rcc.us-east-1.awsapprunner.com/programas')  
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const programas = data.programas;
                const select = document.getElementById('programaAcademico');
                select.innerHTML = '<option value="">Seleccione un programa</option>'; 
                programas.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id; 
                    option.textContent = p.nombre_programa;
                    select.appendChild(option);
                });
            } else {
                console.error(" Error al cargar programas:", data);
            }
        })
        .catch(error => console.error(' Error al cargar programas:', error));
}

cargarProgramas();



