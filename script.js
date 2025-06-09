const imageInput = document.getElementById('imageInput');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const resizeOption = document.getElementById('resizeOption');
const sizeInputs = document.getElementById('sizeInputs');
const widthInputGroup = document.getElementById('widthInputGroup');
const heightInputGroup = document.getElementById('heightInputGroup');
const scaleDownGroup = document.getElementById('scaleDownGroup');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const scaleDown = document.getElementById('scaleDown');
const compressBtn = document.getElementById('compressBtn');
const result = document.getElementById('result');
const outputImages = document.getElementById('outputImages');
const downloadZip = document.getElementById('downloadZip');
const fileSizes = document.getElementById('fileSizes');

qualitySlider.addEventListener('input', () => {
  qualityValue.textContent = `${qualitySlider.value}%`;
});

resizeOption.addEventListener('change', () => {
  sizeInputs.classList.toggle('hidden', resizeOption.value === 'keepRatio' && !widthInput.value && !heightInput.value);
  widthInputGroup.classList.toggle('hidden', resizeOption.value === 'scaleHeight');
  heightInputGroup.classList.toggle('hidden', resizeOption.value === 'scaleWidth');
  scaleDownGroup.classList.toggle('hidden', resizeOption.value === 'keepRatio');
});

compressBtn.addEventListener('click', async () => {
  if (!imageInput.files.length) {
    alert('Please select at least one image!');
    return;
  }

  outputImages.innerHTML = '';
  fileSizes.innerHTML = '';
  result.classList.add('hidden');

  const zip = new JSZip();
  const files = Array.from(imageInput.files);
  const picaInstance = pica();
  const quality = parseInt(qualitySlider.value) / 100;
  let totalSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const img = new Image();
    img.src = URL.createObjectURL(file);

    await new Promise((resolve) => {
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (resizeOption.value === 'scaleWidth' && widthInput.value) {
          const maxWidth = parseInt(widthInput.value);
          if (scaleDown.checked && img.width > maxWidth) {
            targetWidth = maxWidth;
            targetHeight = Math.round((img.height / img.width) * targetWidth);
          } else if (!scaleDown.checked) {
            targetWidth = maxWidth;
            targetHeight = img.height;
          }
        } else if (resizeOption.value === 'scaleHeight' && heightInput.value) {
          const maxHeight = parseInt(heightInput.value);
          if (scaleDown.checked && img.height > maxHeight) {
            targetHeight = maxHeight;
            targetWidth = Math.round((img.width / img.height) * targetHeight);
          } else if (!scaleDown.checked) {
            targetHeight = maxHeight;
            targetWidth = img.width;
          }
        } else if (resizeOption.value === 'custom' && widthInput.value && heightInput.value) {
          const maxWidth = parseInt(widthInput.value);
          const maxHeight = parseInt(heightInput.value);
          if (scaleDown.checked) {
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            targetWidth = Math.round(img.width * ratio);
            targetHeight = Math.round(img.height * ratio);
          } else {
            targetWidth = maxWidth;
            targetHeight = maxHeight;
          }
        } else if (resizeOption.value === 'keepRatio' && widthInput.value) {
          targetWidth = parseInt(widthInput.value);
          targetHeight = Math.round((img.height / img.width) * targetWidth);
        } else if (resizeOption.value === 'keepRatio' && heightInput.value) {
          targetHeight = parseInt(heightInput.value);
          targetWidth = Math.round((img.width / img.height) * targetHeight);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        await picaInstance.resize(img, canvas, {
          quality: 3,
          alpha: true
        });

        canvas.toBlob((blob) => {
          const imgElement = document.createElement('img');
          imgElement.src = URL.createObjectURL(blob);
          imgElement.className = 'output-image';
          outputImages.appendChild(imgElement);

          const fileName = `compressed_${file.name.replace(/\.[^/.]+$/, '')}.jpeg`;
          zip.file(fileName, blob);
          totalSize += blob.size;
          fileSizes.innerHTML += `File ${fileName}: ${(blob.size / 1024).toFixed(2)} KB<br>`;

          if (i === files.length - 1) {
            fileSizes.innerHTML += `Total size: ${(totalSize / 1024).toFixed(2)} KB`;
            result.classList.remove('hidden');
            zip.generateAsync({ type: 'blob' }).then((content) => {
              downloadZip.onclick = () => saveAs(content, 'compressed_images.zip');
            });
          }
          resolve();
        }, 'image/jpeg', quality);

        URL.revokeObjectURL(img.src);
      };
    });
  }
});