const formulario = document.getElementById('formularioVenta');
const mensajeVisual = document.getElementById('mensaje');

formulario.addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const productoSeleccionado = document.getElementById('producto').value.trim();
    const cantidadEscrita = document.getElementById('cantidad').value;

    // Validaciones básicas del lado del cliente
    if (productoSeleccionado === "" || cantidadEscrita === "") {
        mensajeVisual.innerText = "⚠️ Error: Por favor, llena todos los campos.";
        mensajeVisual.style.color = "red";
        return;
    }

    if (parseInt(cantidadEscrita) <= 0) {
        mensajeVisual.innerText = "⚠️ Error: La cantidad debe ser mayor a 0.";
        mensajeVisual.style.color = "red";
        return;
    }

    mensajeVisual.innerText = "⏳ Conectando con el servidor de la ferretería...";
    mensajeVisual.style.color = "orange";

    try {
        // ENVIAMOS LOS DATOS AL BACKEND (servidor.js) USANDO FETCH
        const respuesta = await fetch('/api/vender', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producto: productoSeleccionado, cantidad: cantidadEscrita })
        });

        const resultado = await respuesta.json();

        // Mostramos el mensaje que nos devuelva el servidor (si hubo éxito o si faltó stock)
        mensajeVisual.innerText = resultado.mensaje;
        if (resultado.exito) {
            mensajeVisual.style.color = "green";
            formulario.reset(); // Limpia el formulario solo si la venta fue exitosa
        } else {
            mensajeVisual.style.color = "red";
        }

    } catch (error) {
        mensajeVisual.innerText = "❌ Error al conectar con el servidor.";
        mensajeVisual.style.color = "red";
    }
});
