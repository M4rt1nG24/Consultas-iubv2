document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    loginUsuario();
});

const API_URL = "https://4jdp777rcc.us-east-1.awsapprunner.com";

function loginUsuario() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const mensajeLogin = document.getElementById('error-message');

    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }) 
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('id_usuario', username);
            localStorage.setItem('rol', data.rol);
            localStorage.setItem('nombre_usuario',data.nombre)

            if (data.rol === 'Lider') {
                window.location.href = 'lideres.html';
            } else if (data.rol === 'Docente') {
                window.location.href = 'docentes.html';
            } else if (data.rol === 'Estudiante') {
                window.location.href = 'estudiantes.html';
            }
        } else {
            mensajeLogin.innerText = 'Usuario o contraseña incorrectos.';
        }
    })
    .catch(error => {
        console.error('Error al iniciar sesión:', error);
        mensajeLogin.innerText = 'Error de conexión con el servidor.';
    }); 
}














