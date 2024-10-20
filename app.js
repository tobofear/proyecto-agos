function onOpenCvReady() {
  console.log('OpenCV.js loaded');
  document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      processImage(this);
    };
    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
}

function processImage(image) {
  const canvas = document.getElementById('outputCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  // Convertir la imagen a un objeto Mat de OpenCV.js
  const src = cv.imread(canvas);

  // Convertir la imagen a HSV
  const hsv = new cv.Mat();
  cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

  // Definir el rango de color azul en HSV
  const lowerBlue = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [90, 50, 50, 0]);//Hue(matriz, cant de componentes),Saturacion,Valor, transparencia
  const upperBlue = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [130, 255, 255, 255]);//totalmente opaco 255 en traparencia
  // Rango para colores verdes
  const lowerGreen = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [35, 50, 50, 0]);
  const upperGreen = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [85, 255, 255, 255]);
  // Crear máscaras para verdes y azules
  let maskGreen = new cv.Mat();
  let maskBlue = new cv.Mat();
  cv.inRange(hsv, lowerGreen, upperGreen, maskGreen);
  cv.inRange(hsv, lowerBlue, upperBlue, maskBlue);

  // Combinar las máscaras para obtener una única máscara que incluya ambos colores
  let mask = new cv.Mat();
  cv.bitwise_or(maskGreen, maskBlue, mask);

  // Aplicar umbralización
  const dst = new cv.Mat();
  cv.threshold(mask, dst, 100, 255, cv.THRESH_BINARY);

  // Calcular la intensidad del color
  const intensity = cv.countNonZero(dst);
  document.getElementById("colorIntensity").textContent = intensity + ' mg/dl';

  // Mostrar el resultado en el canvas
  cv.imshow(canvas, dst);

  // Actualizar la rueda de intensidad
  updateIntensityCircle(intensity);

  // Liberar memoria
  src.delete();
  hsv.delete();
  lowerBlue.delete();
  upperBlue.delete();
  mask.delete();
  maskGreen.delete();
  maskBlue.delete();
  dst.delete();
}

function updateIntensityCircle(intensity) {
  const maxIntensity = 4258;
  const percentage = Math.min(intensity / maxIntensity, 1) * 100;

  const canvas = document.getElementById('intensityCanvas');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 70;
  const startAngle = -0.5 * Math.PI; // Empezar en la parte superior
  const endAngle = startAngle + (2 * Math.PI * (percentage / 100));

  // Determinar el color y el texto en función del porcentaje
  let color;
  let text;
  if (percentage <= 30) {
    color = 'orange';
    text = 'Glucosa Baja';
  } else if (percentage <= 60) {
    color = 'green';
    text = 'Normal';
  } else {
    color = 'red';
    text = 'Glucosa Alta';
  }

  // Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar el fondo del círculo
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#E0E0E0'; // Color gris para el fondo del círculo
  ctx.lineWidth = 10;
  ctx.stroke();
  // Dibujar el círculo de progreso con el color determinado
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.stroke();

  // Mostrar la intensidad en el centro
  ctx.font = '18px Arial';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(intensity + ' mg/dl', centerX, centerY);

  // Mostrar el texto debajo del círculo
  const statusText = document.getElementById('statusText');
  statusText.textContent = text;
  statusText.style.color = color;

  // Ajustar el tamaño del contenedor
  const appContainer = document.getElementById('app');
  appContainer.classList.add('expanded'); // Agregar clase para agrandar el contenedor
}

function drawEmptyCircle() {
  const canvas = document.getElementById('intensityCanvas');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 70;

  // Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar el borde del círculo vacío
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#E0E0E0'; // Color gris para el círculo vacío
  ctx.lineWidth = 10;
  ctx.stroke();

  // Mostrar 0 mg/dl en el centro
  ctx.font = '18px Arial';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('0 mg/dl', centerX, centerY);
}


// Llama a esta función cuando la página se cargue
window.onload = function () {
  drawEmptyCircle();
};

function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      processImage(this);
      document.getElementById('boton-file').classList.add('d-none'); // Ocultar el botón de subir archivo
      document.getElementById('backButton').classList.remove('d-none'); // Mostrar el botón de Back
    };
    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
}

// Función para el botón de Back
document.getElementById('backButton').addEventListener('click', function () {
  location.reload(); // Recargar la página para reiniciar
});
