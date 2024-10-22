document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('downloadBtn').addEventListener('click', function () {
    // Obtener el contenido HTML
    const contentElement = document.getElementById('contentToConvert');
    const contentHtml = contentElement.innerHTML; // Obtener todo el HTML

    // Crear un Blob de texto
    const blob = new Blob([contentHtml], { type: 'text/html' });

    // Crear una URL para el Blob
    const url = URL.createObjectURL(blob);

    // Crear un enlace temporal para descargar el archivo
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guia_colorimetria.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});