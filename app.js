import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();
let ffmpegLoaded = false;

// UI elements
const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const progressEl = document.getElementById('progress');
const statusEl = document.getElementById('status');
const downloadLink = document.getElementById('download');

// Load FFmpeg lazily
async function loadFFmpeg() {
  if (ffmpegLoaded) return;

  statusEl.textContent = 'Loading converter…';

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
  });

  ffmpeg.on('progress', ({ progress }) => {
    progressEl.value = progress;
  });

  ffmpegLoaded = true;
  statusEl.textContent = 'Ready';
}

// Conversion handler
convertBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a file');
    return;
  }

  progressEl.value = 0;
  downloadLink.style.display = 'none';
  statusEl.textContent = 'Preparing…';

  try {
    await loadFFmpeg();

    const inputExt = file.name.split('.').pop();
    const inputName = `input.${inputExt}`;
    const outputName = 'output.mp3';

    statusEl.textContent = 'Reading file…';
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    statusEl.textContent = 'Converting…';
    await ffmpeg.exec([
      '-i', inputName,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ab', '192k',
      outputName
    ]);

    statusEl.textContent = 'Finalizing…';
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);

    downloadLink.href = url;
    downloadLink.download =
      file.name.replace(/\.[^/.]+$/, '') + '.mp3';
    downloadLink.textContent = 'Download MP3';
    downloadLink.style.display = 'inline-block';

    // Cleanup to avoid memory bloat
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    statusEl.textContent = 'Done';

  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Error';
    alert('Conversion failed. See console for details.');
  }
});

