const worker = new Worker("worker.js", { type: "module" });
let selectedFile = null;

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");

const fileInfo = document.getElementById("fileInfo");
const fileNameEl = document.getElementById("fileName");
const fileSizeEl = document.getElementById("fileSize");
const fileTypeEl = document.getElementById("fileType");
const convertBtn = document.getElementById("convertBtn");

const MAX_SIZE_MB = 200;
const ALLOWED_EXT = ["mp4", "avi", "mov", "mp3"];

function formatSize(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function handleFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  if (!ALLOWED_EXT.includes(ext)) {
    alert("Unsupported file type.");
    return;
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    alert("File is too large.");
    return;
  }

  selectedFile = file;

  fileNameEl.textContent = file.name;
  fileSizeEl.textContent = formatSize(file.size);
  fileTypeEl.textContent = file.type || "unknown";

  fileInfo.classList.remove("hidden");
  convertBtn.classList.add("enabled");
  convertBtn.disabled = false;
}

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");

  if (e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

convertBtn.addEventListener("click", () => {
  if (!selectedFile) return;

  convertBtn.textContent = "Converting…";
  convertBtn.disabled = true;

  worker.postMessage({
    action: "convert",
    file: selectedFile
  });
});

worker.onmessage = (event) => {
  const { success, output, error } = event.data;

  convertBtn.textContent = "Convert";
  convertBtn.disabled = false;

  if (!success) {
    alert("Conversion failed: " + error);
    return;
  }

  const blob = new Blob([output], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "output.mp3";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
};
