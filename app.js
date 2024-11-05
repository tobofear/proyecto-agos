document.addEventListener('DOMContentLoaded', () => {
  const diabeticoSelect = document.getElementById('choice');
  const nextButton = document.getElementById('nextButton');
  const label = document.querySelector('.label');
  const intensityContainer = document.querySelector('.intensity-container');
  const fileSelectContainer = document.querySelector('.file-select');

  // Ocultar el contenedor de intensidad y el botón de Medir Glucosa inicialmente
  intensityContainer.style.display = 'none';
  fileSelectContainer.style.display = 'none';

  nextButton.addEventListener('click', () => {
    const diabetico = diabeticoSelect.value;

    // Verificar si es diabético o no
    if (diabetico === 'yes' || diabetico === 'no') {
      intensityContainer.style.display = 'block'; // Mostrar el contenedor de intensidad
      fileSelectContainer.style.display = 'block'; // Mostrar el botón de Medir Glucosa

      // Ocultar el select y el botón de Siguiente
      label.style.display = 'none';
      diabeticoSelect.style.display = 'none';
      nextButton.style.display = 'none';
    } else {
      alert('Por favor, seleccione una opción válida.'); // Alerta si no se ha seleccionado una opción
    }
  });
});

function onOpenCvReady() {
  console.log('OpenCV.js loaded');
  document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
}

function processImage(image) {
  const canvas = document.getElementById('outputCanvas');
  const ctx = canvas.getContext('2d');
  // Definir un tamaño máximo para el canvas
  const maxWidth = 300; // Ancho máximo deseado
  const maxHeight = 300; // Alto máximo deseado

  // Calcular la relación de aspecto de la imagen
  const aspectRatio = image.width / image.height;

  // Calcular el nuevo tamaño basado en la relación de aspecto
  let newWidth, newHeight;
  if (image.width > image.height) {
    newWidth = Math.min(maxWidth, image.width);
    newHeight = newWidth / aspectRatio;
  } else {
    newHeight = Math.min(maxHeight, image.height);
    newWidth = newHeight * aspectRatio;
  }

  // Establecer el tamaño del canvas
  canvas.width = maxWidth;
  canvas.height = maxHeight;

  // Calcular las posiciones para centrar la imagen en el canvas
  const xOffset = (maxWidth - newWidth) / 2;
  const yOffset = (maxHeight - newHeight) / 2;

  // Dibujar la imagen escalada y centrada en el canvas
  ctx.drawImage(image, xOffset, yOffset, newWidth, newHeight);

  // Convertir la imagen a un objeto Mat de OpenCV.js
  const src = cv.imread(canvas);

  // Convertir la imagen a HSV
  const hsv = new cv.Mat();
  cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

  // Definir el rango de color azul en HSV
  const lowerBlue = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [90, 50, 50, 0]);
  const upperBlue = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [130, 255, 255, 255]);

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
  let intensity = Number(cv.countNonZero(dst));
  let glucosa = Math.trunc(intensity * 0.424 - 35.6);
  document.getElementById("colorIntensity").textContent = glucosa + ' mg/dl';

  // Mostrar el resultado en el canvas
  cv.imshow(canvas, dst);

  // Actualizar la rueda de intensidad
  updateIntensityCircle(glucosa);

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

// Llama a esta función cuando la página se cargue
window.onload = function () {
  drawEmptyCircle(); // Dibuja el círculo vacío al cargar
};

function updateIntensityCircle(intensity) {
  const diabInput = document.getElementById('choice');
  let maxIntensity;
  if (diabInput.value === 'yes') {
    maxIntensity = 180; // 80-130mg/dl (normal), <180mg/dl (2h despues de comer) 
  } else {
    maxIntensity = 140;//70-100mg/dl, <140mg/dl (2h despues de comer) , los dos llegan a 180 pero los porcentajes cambian
  }
  console.log(maxIntensity)
  const percentage = Math.min(intensity / maxIntensity, 1) * 100;

  const canvas = document.getElementById('intensityCanvas');
  const ctx = canvas.getContext('2d');

  // Establecer el tamaño del canvas
  canvas.width = 200; // Ancho del canvas
  canvas.height = 200; // Alto del canvas

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 90; // Radio del círculo
  const startAngle = -0.5 * Math.PI; // Comenzar en la parte superior
  const endAngle = startAngle + (2 * Math.PI * (percentage / 100));

  // Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar el anillo exterior que representa las zonas de bajo, normal y alto
  const outerRadius = radius - 20; // Radio exterior
  const innerRadius = radius - 10;  // Radio interior

  // Dibujar la zona "Bajo"
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + (2 * Math.PI * 0.5));
  ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI * 0.5), startAngle, true);
  ctx.closePath();
  ctx.fillStyle = '#f27f1b';
  ctx.fill();

  // Dibujar la zona "Normal"
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, startAngle + (2 * Math.PI * 0.5), startAngle + (2 * Math.PI * 0.72));
  ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI * 0.72), startAngle + (2 * Math.PI * 0.5), true);
  ctx.closePath();
  ctx.fillStyle = '#1bf222';
  ctx.fill();

  // Dibujar la zona "Alto"
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, startAngle + (2 * Math.PI * 0.72), startAngle + (2 * Math.PI));
  ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI), startAngle + (2 * Math.PI * 0.72), true);
  ctx.closePath();
  ctx.fillStyle = '#f21b1b';
  ctx.fill();

  // Dibujar el fondo del círculo de progreso
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#E0E0E0'; // Color gris para el fondo del círculo
  ctx.lineWidth = 10;
  ctx.stroke();

  // Dibujar el círculo de progreso con el color determinado
  let color;
  let text;
  if (percentage <= 50) {
    color = '#82c6ed';
    text = 'Glucosa Baja';
  } else if (percentage <= 72) {
    color = '#55b8f2';
    text = 'Normal';
  } else {
    color = '#1f75a6';
    text = 'Glucosa Alta';
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.stroke();

  // Mostrar la intensidad en el centro
  ctx.font = '22px Arial';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(intensity + ' mg/dl', centerX, centerY);

  // Mostrar el texto debajo del círculo
  const statusText = document.getElementById('statusText');
  statusText.textContent = text;
  statusText.style.color = color;
  statusText.style.fontSize = '20px'; // Aumentar el tamaño de la letra
  // statusText.style.fontWeight = 'bold'; // Hacer la letra en negrita

  // Ajustar el tamaño del contenedor
  const appContainer = document.getElementById('app');
  appContainer.classList.add('expanded'); // Agregar clase para agrandar el contenedor
}

function drawCircle(intensity) {
  const canvas = document.getElementById('intensityCanvas');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 90; // Radio del círculo
  const outerRadius = radius - 20; // Radio exterior
  const innerRadius = radius - 10;  // Radio interior

  // Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Definimos el ángulo inicial
  const startAngle = -0.5 * Math.PI; // Comenzar en la parte superior

  // Dibujar la zona "Bajo"
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + (2 * Math.PI * 0.3));
  ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI * 0.3), startAngle, true);
  ctx.closePath();
  ctx.fillStyle = '#f2a31b'; // Color para la zona bajo (azul claro)
  ctx.fill();

  // Dibujar la zona "Normal"
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, startAngle + (2 * Math.PI * 0.3), startAngle + (2 * Math.PI * 0.6));
  ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI * 0.6), startAngle + (2 * Math.PI * 0.3), true);
  ctx.closePath();
  ctx.fillStyle = '#63f79e'; // Color para la zona normal (amarillo)
  ctx.fill();

  // Dibujar la zona "Alto"
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, startAngle + (2 * Math.PI * 0.6), startAngle + (2 * Math.PI));
  ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI), startAngle + (2 * Math.PI * 0.6), true);
  ctx.closePath();
  ctx.fillStyle = '#f25555'; // Color para la zona alto (rojo)
  ctx.fill();
  // Dibujar el fondo del círculo de progreso
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#E0E0E0'; // Color gris para el fondo del círculo
  ctx.lineWidth = 10;
  ctx.stroke();


  // Añadir el texto de intensidad en el centro
  ctx.font = '22px Arial';
  ctx.fillStyle = '#3AB0A6'; // Color del texto
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(intensity + ' mg/dl', centerX, centerY);
}

// Llama a drawCircle con un valor de intensidad al cargar
window.onload = function () {
  drawCircle(0); // Dibuja el círculo vacío al cargar
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
