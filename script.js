const fileInput = document.getElementById('fileInput');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const resizeOption = document.getElementById('resizeOption');
const outputFormat = document.getElementById('outputFormat');
const sizeInputs = document.getElementById('sizeInputs');
const widthInputGroup = document.getElementById('widthInputGroup');
const heightInputGroup = document.getElementById('heightInputGroup');
const scaleDownGroup = document.getElementById('scaleDownGroup');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const scaleDown = document.getElementById('scaleDown');
const processBtn = document.getElementById('processBtn');
const result = document.getElementById('result');
const outputFiles = document.getElementById('outputFiles');
const downloadZip = document.getElementById('downloadZip');
const fileSizes = document.getElementById('fileSizes');
const uploadProgress = document.getElementById('uploadProgress');
const uploadBar = document.getElementById('uploadBar');
const uploadText = document.getElementById('uploadText');
const processProgress = document.getElementById('processProgress');
const processBar = document.getElementById('processBar');
const processText = document.getElementById('processText');

let fileType = 'image'; // Mặc định là image

qualitySlider.addEventListener('input', () => {
  updateQualityDisplay();
});

fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files);
  if (files.length === 0) {
    outputFormat.innerHTML = `
      <option value="original">Original (Image: JPEG, Video: MP4)</option>
      <option value="gif">GIF</option>
      <option value="mp3">MP3 (Audio only, Video only)</option>
    `;
    fileType = 'image';
    updateQualitySlider('image');
    return;
  }

  const isImage = files.every(file => file.type.startsWith('image/'));
  const isVideo = files.every(file => file.type.startsWith('video/'));
  fileType = isImage ? 'image' : isVideo ? 'video' : 'mixed';

  if (fileType === 'image') {
    outputFormat.innerHTML = `
      <option value="original">JPEG</option>
      <option value="gif">GIF</option>
    `;
    updateQualitySlider('image');
  } else if (fileType === 'video') {
    outputFormat.innerHTML = `
      <option value="original">MP4</option>
      <option value="gif">GIF</option>
      <option value="mp3">MP3</option>
    `;
    updateQualitySlider(outputFormat.value);
  } else {
    outputFormat.innerHTML = `<option value="original">Original</option>`;
    updateQualitySlider('mixed');
  }
});

outputFormat.addEventListener('change', () => {
  updateQualitySlider(fileType === 'video' ? outputFormat.value : fileType);
});

resizeOption.addEventListener('change', () => {
  const isPreset = ['hd', 'fhd', 'qhd', '4k'].includes(resizeOption.value);
  sizeInputs.classList.toggle('hidden', isPreset || (resizeOption.value === 'keepRatio' && !widthInput.value && !heightInput.value));
  widthInputGroup.classList.toggle('hidden', resizeOption.value === 'scaleHeight');
  heightInputGroup.classList.toggle('hidden', resizeOption.value === 'scaleWidth');
  scaleDownGroup.classList.toggle('hidden', resizeOption.value === 'keepRatio');
});

function updateQualitySlider(type) {
  if (type === 'image') {
    qualitySlider.min = 0;
    qualitySlider.max = 100;
    qualitySlider.value = 80;
    qualityValue.textContent = '80%';
  } else if (type === 'mp3') {
    qualitySlider.min = 64;
    qualitySlider.max = 320;
    qualitySlider.value = 192;
    qualityValue.textContent = '192 kbps';
  } else if (type === 'gif') {
    qualitySlider.min = 1;
    qualitySlider.max = 30;
    qualitySlider.value = 10;
    qualityValue.textContent = '10 fps';
  } else if (type === 'video' || type === 'original') {
    qualitySlider.min = 0;
    qualitySlider.max = 51;
    qualitySlider.value = 23;
    qualityValue.textContent = 'CRF 23';
  } else {
    qualitySlider.min = 0;
    qualitySlider.max = 100;
    qualitySlider.value = 80;
    qualityValue.textContent = '80%';
  }
}

function updateQualityDisplay() {
  if (fileType === 'image') {
    qualityValue.textContent = `${qualitySlider.value}%`;
  } else if (outputFormat.value === 'mp3') {
    qualityValue.textContent = `${qualitySlider.value} kbps`;
  } else if (outputFormat.value === 'gif') {
    qualityValue.textContent = `${qualitySlider.value} fps`;
  } else if (fileType === 'video' || outputFormat.value === 'original') {
    qualityValue.textContent = `CRF ${qualitySlider.value}`;
  } else {
    qualityValue.textContent = `${qualitySlider.value}%`;
  }
}

processBtn.addEventListener('click', async () => {
  if (!fileInput.files.length) {
    alert('Please select at least one image or video!');
    return;
  }

  outputFiles.innerHTML = '';
  fileSizes.innerHTML = '';
  result.classList.add('hidden');
  processProgress.classList.remove('hidden');
  processBar.style.width = '0%';
  processText.textContent = 'Processing: 0%';

  const zip = new JSZip();
  const files = Array.from(fileInput.files);
  const picaInstance = pica();
  let totalSize = 0;

  // Giả lập upload progress
  uploadProgress.classList.remove('hidden');
  for (let i = 0; i <= 100; i += 10) {
    uploadBar.style.width = `${i}%`;
    uploadText.textContent = `Uploading: ${i}%`;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  uploadProgress.classList.add('hidden');

  // Khởi tạo FFmpeg
  const { createFFmpeg, fetchFile } = FFmpeg;
  const ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isImage = file.type.startsWith('image/');
    const fileName = `processed_${file.name.replace(/\.[^/.]+$/, '')}.${outputFormat.value === 'gif' ? 'gif' : outputFormat.value === 'mp3' ? 'mp3' : isImage ? 'jpeg' : 'mp4'}`;

    if (isImage) {
      // Xử lý ảnh
      const img = new Image();
      img.src = URL.createObjectURL(file);

      await new Promise((resolve) => {
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let targetWidth = img.width;
          let targetHeight = img.height;

          if (resizeOption.value === 'hd') { targetWidth = 1280; targetHeight = 720; }
          else if (resizeOption.value === 'fhd') { targetWidth = 1920; targetHeight = 1080; }
          else if (resizeOption.value === 'qhd') { targetWidth = 2560; targetHeight = 1440; }
          else if (resizeOption.value === '4k') { targetWidth = 3840; targetHeight = 2160; }
          else if (resizeOption.value === 'scaleWidth' && widthInput.value) {
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

          await picaInstance.resize(img, canvas, { quality: 3, alpha: true });

          canvas.toBlob((blob) => {
            const imgElement = document.createElement('img');
            imgElement.src = URL.createObjectURL(blob);
            imgElement.className = 'output-image';
            outputFiles.appendChild(imgElement);

            zip.file(fileName, blob);
            totalSize += blob.size;
            fileSizes.innerHTML += `File ${fileName}: ${(blob.size / 1024).toFixed(2)} KB<br>`;

            processBar.style.width = `${((i + 1) / files.length) * 100}%`;
            processText.textContent = `Processing: ${Math.round(((i + 1) / files.length) * 100)}%`;

            if (i === files.length - 1) {
              finalizeZip(zip, totalSize);
            }
            resolve();
          }, 'image/jpeg', parseInt(qualitySlider.value) / 100);

          URL.revokeObjectURL(img.src);
        };
      });
    } else {
      // Xử lý video
      const inputName = 'input.' + file.name.split('.').pop();
      ffmpeg.FS('writeFile', inputName, await fetchFile(file));

      let targetWidth = -1;
      let targetHeight = -1;
      let outputExt = outputFormat.value === 'gif' ? 'gif' : outputFormat.value === 'mp3' ? 'mp3' : 'mp4';
      let filter = '';

      if (resizeOption.value === 'hd') { targetWidth = 1280; targetHeight = 720; }
      else if (resizeOption.value === 'fhd') { targetWidth = 1920; targetHeight = 1080; }
      else if (resizeOption.value === 'qhd') { targetWidth = 2560; targetHeight = 1440; }
      else if (resizeOption.value === '4k') { targetWidth = 3840; targetHeight = 2160; }
      else if (resizeOption.value === 'scaleWidth' && widthInput.value) {
        const maxWidth = parseInt(widthInput.value);
        if (scaleDown.checked) {
          filter = `scale=${maxWidth}:-2`;
        } else {
          filter = `scale=${maxWidth}:-1`;
        }
      } else if (resizeOption.value === 'scaleHeight' && heightInput.value) {
        const maxHeight = parseInt(heightInput.value);
        if (scaleDown.checked) {
          filter = `scale=-2:${maxHeight}`;
        } else {
          filter = `scale=-1:${maxHeight}`;
        }
      } else if (resizeOption.value === 'custom' && widthInput.value && heightInput.value) {
        const maxWidth = parseInt(widthInput.value);
        const maxHeight = parseInt(heightInput.value);
        if (scaleDown.checked) {
          filter = `scale=${maxWidth}:${maxHeight}:force_original_aspect_ratio=decrease`;
        } else {
          filter = `scale=${maxWidth}:${maxHeight}`;
        }
      } else if (resizeOption.value === 'keepRatio' && widthInput.value) {
        filter = `scale=${parseInt(widthInput.value)}:-2`;
      } else if (resizeOption.value === 'keepRatio' && heightInput.value) {
        filter = `scale=-2:${parseInt(heightInput.value)}`;

      const outputName = `output.${outputExt}`;
      let command = ['-i', inputName];
      if (outputExt === 'mp3') {
        command.push('-vn', '-acodec', 'mp3', '-ab', `${qualitySlider.value}k`, outputName);
      } else if (outputExt === 'gif') {
        command.push('-vf', `${filter},fps=${qualitySlider.value}`, '-loop', '0', outputName);
      } else {
        command.push('-vf', filter, '-c:v', 'libx264', '-crf', qualitySlider.value, outputName);
      }

      await ffmpeg.run(...command);
      const outputData = ffmpeg.FS('readFile', outputName);
      const blob = new Blob([outputData.buffer], { type: outputExt === 'mp3' ? 'audio/mp3' : outputExt === 'gif' ? 'image/gif' : 'video/mp4' });

      const element = outputExt === 'mp3' ? document.createElement('audio') : outputExt === 'gif' ? document.createElement('img') : document.createElement('video');
      element.src = URL.createObjectURL(blob);
      element.className = outputExt === 'mp3' ? 'output-audio' : outputExt === 'gif' ? 'output-image' : 'output-video';
      element.controls = outputExt !== 'gif';
      outputFiles.appendChild(element);

      zip.file(fileName, blob);
      totalSize += blob.size;
      fileSizes.innerHTML += `File ${fileName}: ${(blob.size / 1024).toFixed(2)} KB<br>`;

      processBar.style.width = `${((i + 1) / files.length) * 100}%`;
      processText.textContent = `Processing: ${Math.round(((i + 1) / files.length) * 100)}%`;

      if (i === files.length - 1) {
        finalizeZip(zip, totalSize);
      }

      ffmpeg.FS('unlink', inputName);
      ffmpeg.FS('unlink', outputName);
    }
  }

  function finalizeZip(zip, totalSize) {
    processProgress.classList.add('hidden');
    fileSizes.innerHTML += `Total size: ${(totalSize / 1024).toFixed(2)} KB`;
    result.classList.remove('hidden');
    zip.generateAsync({ type: 'blob' }).then((content) => {
      downloadZip.onclick = () => saveAs(content, 'processed_files.zip');
    });
  }
});