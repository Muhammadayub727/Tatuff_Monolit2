document.addEventListener('DOMContentLoaded', () => {
  const fileUploadContainer = document.getElementById('fileUploadContainer');
  const fileDetailsContainer = document.getElementById('fileDetailsContainer');
  const headerTabs = document.querySelectorAll('.header_tabs li');

  const MAX_FILES = 3;
  let uploadedFiles = loadFilesFromLocalStorage();
  let currentUploadFormsCount = 0;

  // Helper function to render a single file upload form
  function renderUploadForm() {
      if (currentUploadFormsCount >= MAX_FILES) {
          alert("Siz maksimal fayl yuklash soniga yetdingiz (3 ta).");
          return;
      }

      const formId = `uploadForm-${currentUploadFormsCount}`;
      const formHtml = `
          <form id="${formId}" class="file-upload-form">
              <div class="form-group">
                  <label for="uploaderName-${currentUploadFormsCount}">Fayl qo'shuvchi (Ism, Familiya):</label>
                  <input type="text" id="uploaderName-${currentUploadFormsCount}" placeholder="Ismingiz va Familiyangiz" required />
              </div>
              <div class="form-group">
                  <label for="fileInput-${currentUploadFormsCount}">Fayl tanlang:</label>
                  <input type="file" id="fileInput-${currentUploadFormsCount}" accept=".doc,.docx,.ppt,.pptx,.xls,.xlsx,.pdf,.txt,.exe" required />
              </div>
              <div class="form-group">
                  <label for="comment-${currentUploadFormsCount}">Izoh:</label>
                  <textarea id="comment-${currentUploadFormsCount}" placeholder="Fayl haqida izoh yozing"></textarea>
              </div>
              <button type="submit" class="file-upload-button">Yuklash</button>
          </form>
      `;
      fileUploadContainer.insertAdjacentHTML('beforeend', formHtml);

      const form = document.getElementById(formId);
      form.addEventListener('submit', handleFileUpload);
      currentUploadFormsCount++;
  }

  // Handle file upload submission
  function handleFileUpload(event) {
      event.preventDefault();

      const form = event.target;
      const uploaderNameInput = form.querySelector('input[type="text"]');
      const fileInput = form.querySelector('input[type="file"]');
      const commentInput = form.querySelector('textarea');

      const uploaderName = uploaderNameInput.value.trim();
      const comment = commentInput.value.trim();
      const file = fileInput.files[0];

      if (!uploaderName || !file) {
          alert("Iltimos, fayl qo'shuvchi ismini va faylni tanlang.");
          return;
      }

      // Basic file type validation (client-side)
      const allowedExtensions = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.pdf', '.txt', '.exe'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
          alert("Faqat .doc, .docx, .ppt, .pptx, .xls, .xlsx, .pdf, .txt, .exe fayllarini yuklashingiz mumkin.");
          return;
      }

      // Simulate file content check for status (replace with actual logic if needed)
      // For demonstration, let's say a file is "green" if its name contains "safe"
      const isFileGreen = file.name.toLowerCase().includes('safe');

      const newFile = {
          id: Date.now(), // Unique ID
          uploaderName: uploaderName,
          fileName: file.name,
          fileSize: file.size,
          uploadDate: new Date().toLocaleString(),
          comment: comment,
          status: isFileGreen ? 'green' : 'red', // Initial status
          filePath: URL.createObjectURL(file) // For demonstration, in a real app, this would be a server path
      };

      uploadedFiles.push(newFile);
      saveFilesToLocalStorage();
      renderFileCards();

      // Clear the form and render a new one if not at max
      form.reset();
      form.removeEventListener('submit', handleFileUpload); // Remove listener from old form
      form.style.display = 'none'; // Hide the submitted form
      renderUploadForm();
  }

  // Save files to LocalStorage
  function saveFilesToLocalStorage() {
      localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
  }

  // Load files from LocalStorage
  function loadFilesFromLocalStorage() {
      const data = localStorage.getItem('uploadedFiles');
      return data ? JSON.parse(data) : [];
  }

  // Render file cards in the right panel
  function renderFileCards() {
      fileDetailsContainer.innerHTML = '<h2>Yuklangan fayllar</h2>'; // Clear previous content
      if (uploadedFiles.length === 0) {
          fileDetailsContainer.innerHTML += '<p>Hali yuklangan fayllar yo\'q.</p>';
          return;
      }

      uploadedFiles.forEach(file => {
          const card = document.createElement('div');
          card.className = 'file-card';
          card.innerHTML = `
              <h3>${file.fileName}</h3>
              <p class="uploader-info">Qo'shuvchi: ${file.uploaderName} | Yuklangan sana: ${file.uploadDate}</p>
              ${file.comment ? `<p class="comment-text">Izoh: ${file.comment}</p>` : ''}
              <p>Holati: <span class="status-dot ${file.status}"></span> ${file.status === 'green' ? 'Tasdiqlangan' : 'Tekshirilmoqda'}</p>
              <a href="${file.filePath}" download="${file.fileName}" class="file-download-link" style="color: #4a64e0; text-decoration: none;">Yuklab olish</a>
          `;
          fileDetailsContainer.appendChild(card);
      });
  }

  // Tab switching logic (only educational tab will show files for now)
  headerTabs.forEach(tab => {
      tab.addEventListener('click', () => {
          headerTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          const tabType = tab.dataset.tab;
          if (tabType === 'educational') {
              document.querySelector('.content_left').style.display = 'flex';
              document.querySelector('.content_right').style.display = 'flex';
              // Re-render file upload form if it's not present (e.g., if max files reached)
              if (fileUploadContainer.children.length === 0 || currentUploadFormsCount < MAX_FILES) {
                   // Check if last form is submitted, then add new one
                  const lastForm = fileUploadContainer.lastElementChild;
                  if (!lastForm || lastForm.style.display === 'none') {
                      renderUploadForm();
                  }
              }
              renderFileCards();
          } else {
              document.querySelector('.content_left').style.display = 'none';
              document.querySelector('.content_right').style.display = 'none';
              // You would typically load content for other tabs here
          }
      });
  });

  // Initial load
  renderUploadForm(); // Render the first upload form
  renderFileCards(); // Display any existing uploaded files
});