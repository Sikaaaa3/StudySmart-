
const pdfUpload = document.getElementById("pdf-upload");
const uploadMessage = document.getElementById("upload-message");

pdfUpload.addEventListener("change", function () {
  const file = pdfUpload.files[0];

  if (!file) {
    uploadMessage.textContent = "Supports text-based and scanned PDFs.";
    return;
  }

  const isPDF =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isPDF) {
    uploadMessage.textContent = "Please choose a PDF file.";
    pdfUpload.value = "";
    return;
  }

  uploadMessage.textContent = `Selected: ${file.name}`;
});
