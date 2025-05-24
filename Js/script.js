document.addEventListener('DOMContentLoaded', () => {
  // Main UI Elements
  const mainTabsContainer = document.getElementById('mainTabs');
  const educationalActivityTabsContainer = document.getElementById('educationalActivityTabs');
  const allTabContents = document.querySelectorAll('.tab-content');
  const mainTabs = document.querySelectorAll('#mainTabs li');
  const backToMethodsBtn = document.getElementById('backToMethods');

  // "O'quv usullari" (main page upload) elements
  const fileUploadContainer = document.getElementById('fileUploadContainer');
  const fileDetailsContainer = document.getElementById('fileDetailsContainer');

  // "O‘quv ishlari bo‘yicha" (Learning Activities) elements
  const educationalFilesList = document.getElementById('educationalFilesList'); 
  const educationalFileDetailArea = document.getElementById('educationalFileDetailArea');

  // Modal elements
  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

  // Data and state variables
  let uploadedFiles = loadFilesFromLocalStorage(); 
  let fileToDeleteId = null; 
  let fileToEditId = null; // Faylni tahrirlash uchun ID

  // Allowed file extensions (non-image)
  const ALLOWED_EXTENSIONS = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.pdf', '.txt', '.exe'];
  // Maksimal fayl hajmi (megabaytda)
  const MAX_FILE_SIZE_MB = 500; 
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // MB dan baytga o'tkazish

  // --- Local Storage Management ---

  function saveFilesToLocalStorage() {
      localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
  }

  function loadFilesFromLocalStorage() {
      const data = localStorage.getItem('uploadedFiles');
      return data ? JSON.parse(data) : [];
  }

  // --- File Upload Form Logic (for 'O'quv usullari' tab) ---

  function renderFileUploadForm() {
      // Bu forma faqat yangi fayl yuklash yoki mavjud faylni tahrirlash uchun ishlaydi
      const formHtml = `
          <form id="fileUploadForm" class="file-upload-form">
              <div class="form-group">
                  <label for="uploaderName">Fayl qo'shuvchi (Ism, Familiya):</label>
                  <input type="text" id="uploaderName" placeholder="Ismingiz va Familiyangiz" required />
              </div>
              <div class="form-group">
                  <label for="fileInput">Fayl tanlang:</label>
                  <input type="file" id="fileInput" accept="${ALLOWED_EXTENSIONS.join(',')}" ${fileToEditId === null ? 'required' : ''} />
                  <small style="color: #ccc; font-size: 0.8em; margin-top: 5px;">Rasm fayllari (jpg, png, gif) yuklashga ruxsat berilmagan.</small>
                  <small style="color: #ccc; font-size: 0.8em; margin-top: 5px;">Maksimal fayl hajmi: ${MAX_FILE_SIZE_MB}MB.</small>
              </div>
              <div class="form-group">
                  <label for="comment">Izoh:</label>
                  <textarea id="comment" placeholder="Fayl haqida izoh yozing"></textarea>
              </div>
              <button type="submit" class="file-upload-button" id="submitFileBtn">Yuklash</button>
          </form>
      `;
      fileUploadContainer.innerHTML = formHtml;

      const form = document.getElementById('fileUploadForm');
      form.addEventListener('submit', handleFileUpload);
      
      // Agar tahrirlash rejimi bo'lsa, formani to'ldirish
      if (fileToEditId !== null) {
          const file = uploadedFiles.find(f => f.id === fileToEditId);
          if (file) {
              document.getElementById('uploaderName').value = file.uploaderName;
              document.getElementById('comment').value = file.comment;
              document.getElementById('submitFileBtn').textContent = 'Yangilash';
          }
      } else {
          document.getElementById('submitFileBtn').textContent = 'Yuklash';
      }
  }

  // Handles file upload (only for new files now)
  async function handleFileUpload(event) {
      event.preventDefault();

      const uploaderNameInput = document.getElementById('uploaderName');
      const fileInput = document.getElementById('fileInput');
      const commentInput = document.getElementById('comment');

      const uploaderName = uploaderNameInput.value.trim();
      const comment = commentInput.value.trim();
      const file = fileInput.files[0];

      if (!uploaderName) {
          alert("Iltimos, fayl qo'shuvchi ismini kiriting.");
          return;
      }
      
      if (fileToEditId === null && !file) { // Yangi fayl yuklashda fayl tanlash shart
          alert("Iltimos, faylni tanlang.");
          return;
      }

      let fileBase64 = null;
      let fileName = null;
      let fileSize = null;
      let fileExtension = null;

      if (file) { // Agar yangi fayl tanlansa (yangi fayl yuklashda yoki tahrirlashda almashtirilganda)
          fileExtension = '.' + file.name.split('.').pop().toLowerCase();
          if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
              alert(`Faqat ${ALLOWED_EXTENSIONS.join(', ')} fayllarini yuklashingiz mumkin.`);
              return;
          }

          // --- Fayl hajmini tekshirish ---
          if (file.size > MAX_FILE_SIZE_BYTES) {
              alert(`Fayl hajmi ${MAX_FILE_SIZE_MB}MB dan oshmasligi kerak. Sizning faylingiz hajmi: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
              return;
          }

          fileBase64 = await readFileAsBase64(file);
          fileName = file.name;
          fileSize = file.size;
      } else if (fileToEditId !== null) { // Tahrirlashda yangi fayl tanlanmagan bo'lsa, eski fayl ma'lumotlarini saqlash
          const existingFile = uploadedFiles.find(f => f.id === fileToEditId);
          if (existingFile) {
              fileBase64 = existingFile.base64Data;
              fileName = existingFile.fileName;
              fileSize = existingFile.fileSize;
              fileExtension = '.' + existingFile.fileName.split('.').pop().toLowerCase(); // Eski fayl kengaytmasini olish
          }
      }


      let fileStatus = 'red'; // Default status is 'red' (Tekshirilmoqda)

      // --- Fayl tarkibini simulyatsiya qilish va statusni belgilash ---
      const contentToCheck = (comment + " " + fileName).toLowerCase();
      if (contentToCheck.includes('reklama') || contentToCheck.includes('promo')) {
          fileStatus = 'red'; 
      } else if (fileExtension === '.txt' && fileBase64) {
          try {
              const decodedText = atob(fileBase64.split(',')[1]); 
              if (decodedText.toLowerCase().includes('reklama') || decodedText.toLowerCase().includes('promo') || decodedText.toLowerCase().includes('spam')) {
                  fileStatus = 'red';
              } else {
                  fileStatus = Math.random() < 0.8 ? 'green' : 'red'; 
              }
          } catch (e) {
              console.warn("Base64 dan matnni o'qishda xato, ehtimol matn fayli emas:", e);
              fileStatus = Math.random() < 0.5 ? 'green' : 'red'; 
          }
      } else {
          fileStatus = Math.random() < 0.6 ? 'green' : 'red'; 
      }

      if (fileToEditId !== null) {
          // Edit existing file
          const index = uploadedFiles.findIndex(f => f.id === fileToEditId);
          if (index > -1) {
              const existingFile = uploadedFiles[index];
              uploadedFiles[index] = {
                  id: existingFile.id, // Keep original ID
                  uploaderName: uploaderName,
                  comment: comment,
                  status: fileStatus, // Yangilangan status
                  uploadDate: existingFile.uploadDate, // Keep original upload date
                  base64Data: fileBase64, 
                  fileName: fileName,
                  fileSize: fileSize,
              };
          }
          fileToEditId = null; // Exit edit mode
      } else {
          // Add new file
          const newFile = {
              id: Date.now(), 
              uploaderName: uploaderName,
              fileName: fileName,
              fileSize: fileSize,
              uploadDate: new Date().toLocaleString(),
              comment: comment,
              status: fileStatus, 
              base64Data: fileBase64 
          };
          uploadedFiles.push(newFile);
      }

      saveFilesToLocalStorage();
      renderFileCards(); 
      renderFileUploadForm(); // Reset form
      if (document.getElementById('educationalContent').classList.contains('active-tab')) {
          renderEducationalContent(); 
      }
  }

  function readFileAsBase64(file) {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(file);
      });
  }

  // --- File Card Rendering (for 'O'quv usullari' tab) ---

  function renderFileCards() {
      fileDetailsContainer.innerHTML = '<h2>Yuklangan fayllar</h2>'; 
      if (uploadedFiles.length === 0) {
          fileDetailsContainer.innerHTML += '<p>Hali yuklangan fayllar yo\'q.</p>';
          return;
      }

      uploadedFiles.forEach(file => {
          let blobUrl = '#'; 
          // Yuklab olish linki uchun default disabled holat
          let downloadButtonHtml = `<a class="download-button disabled-button" style="background-color: #555; cursor: not-allowed;">Yuklab olish mavjud emas</a>`; 

          if (file.base64Data) {
              const fileBlob = base64toBlob(file.base64Data, getMimeType(file.fileName));
              if (fileBlob) { 
                  blobUrl = URL.createObjectURL(fileBlob);
                  // YANGI: button elementidan foydalanish, download-button klassini beramiz
                  downloadButtonHtml = `<a href="${blobUrl}" download="${file.fileName}" class="download-button">Yuklab olish</a>`;
              } else {
                  console.warn(`Could not create Blob for file ID ${file.id}. Download link will be disabled.`);
              }
          } else {
              console.warn(`File ID ${file.id} is missing base64Data. Download link will be disabled.`);
          }

          const card = document.createElement('div');
          card.className = 'file-card';
          card.dataset.id = file.id; 

          card.innerHTML = `
              <h3>${file.fileName}</h3>
              <p class="uploader-info">Qo'shuvchi: ${file.uploaderName} | Yuklangan sana: ${file.uploadDate}</p>
              ${file.comment ? `<p class="comment-text">Izoh: ${file.comment}</p>` : ''}
              <p>Holati: <span class="status-dot ${file.status}"></span> ${file.status === 'green' ? 'Tasdiqlangan' : 'Tekshirilmoqda'}</p>
              ${downloadButtonHtml}
              <div class="action-icons">
                  <span class="material-symbols-outlined edit-icon" data-id="${file.id}">edit</span>
                  <span class="material-symbols-outlined delete-icon" data-id="${file.id}">delete</span>
              </div>
          `;
          fileDetailsContainer.appendChild(card);
          
          if (blobUrl !== '#') {
              card.dataset.blobUrl = blobUrl;
          }
      });

      document.querySelectorAll('.edit-icon').forEach(icon => {
          icon.addEventListener('click', (e) => {
              fileToEditId = parseInt(e.target.dataset.id);
              renderFileUploadForm(); // Formani tahrirlash uchun to'ldirish
          });
      });

      document.querySelectorAll('.delete-icon').forEach(icon => {
          icon.addEventListener('click', (e) => {
              fileToDeleteId = parseInt(e.target.dataset.id);
              showDeleteConfirmationModal();
          });
      });
  }

  // --- Helper functions (base64toBlob, getMimeType, etc. remain unchanged) ---

  function base64toBlob(base64, mimeType) {
      if (!base64 || typeof base64 !== 'string' || !base64.includes(',')) {
          console.error("Invalid base64 string provided for Blob creation:", base64 ? base64.substring(0, 50) + "..." : "null/undefined"); 
          return null; 
      }
      try {
          const byteCharacters = atob(base64.split(',')[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          return new Blob([byteArray], { type: mimeType });
      } catch (e) {
          console.error("Error creating Blob from base64:", e, "Base64 string (first 50 chars):", base64 ? base64.substring(0, 50) + "..." : "null/undefined");
          return null; 
      }
  }

  function getMimeType(fileName) {
      if (!fileName) return 'application/octet-stream';
      const ext = fileName.split('.').pop().toLowerCase();
      switch (ext) {
          case 'doc': return 'application/msword';
          case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          case 'ppt': return 'application/vnd.ms-powerpoint';
          case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          case 'xls': return 'application/vnd.ms-excel';
          case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          case 'pdf': return 'application/pdf';
          case 'txt': return 'text/plain';
          case 'exe': return 'application/x-msdownload';
          default: return 'application/octet-stream'; 
      }
  }

  // --- Delete Confirmation Modal Logic ---

  function showDeleteConfirmationModal() {
      deleteModalOverlay.style.display = 'flex';
  }

  function hideDeleteConfirmationModal() {
      deleteModalOverlay.style.display = 'none';
      fileToDeleteId = null; 
  }

  confirmDeleteBtn.addEventListener('click', () => {
      if (fileToDeleteId !== null) {
          deleteFile(fileToDeleteId);
          hideDeleteConfirmationModal();
      }
  });

  cancelDeleteBtn.addEventListener('click', () => {
      hideDeleteConfirmationModal();
  });

  deleteModalOverlay.addEventListener('click', (e) => {
      if (e.target === deleteModalOverlay) {
          hideDeleteConfirmationModal();
      }
  });

  // --- Delete Function ---
  function deleteFile(id) {
      const cardToDelete = document.querySelector(`.file-card .delete-icon[data-id="${id}"]`)?.closest('.file-card');
      if (cardToDelete && cardToDelete.dataset.blobUrl) {
          URL.revokeObjectURL(cardToDelete.dataset.blobUrl);
      }

      uploadedFiles = uploadedFiles.filter(file => file.id !== id);
      saveFilesToLocalStorage();
      renderFileCards(); 
      if (document.getElementById('educationalContent').classList.contains('active-tab')) {
           renderEducationalContent(); 
      }
      renderFileUploadForm(); 
  }

  // --- Tab Switching Logic ---

  function showTab(tabName) {
      allTabContents.forEach(content => {
          content.classList.remove('active-tab');
          content.style.display = 'none'; // Ensure it's hidden
      });

      mainTabsContainer.classList.add('hidden');
      educationalActivityTabsContainer.classList.add('hidden');

      if (tabName === 'educational') {
          document.getElementById('educationalContent').classList.add('active-tab');
          document.getElementById('educationalContent').style.display = 'flex'; 

          educationalActivityTabsContainer.classList.remove('hidden');
          renderEducationalContent(); 
      } else {
          document.getElementById(`${tabName}Content`).classList.add('active-tab');
          document.getElementById(`${tabName}Content`).style.display = 'flex'; 

          mainTabsContainer.classList.remove('hidden');
          mainTabs.forEach(t => t.classList.remove('active'));
          document.querySelector(`#mainTabs li[data-tab="${tabName}"]`).classList.add('active');
          
          if (tabName === 'methods') {
              renderFileUploadForm();
              renderFileCards();
          }
      }
  }

  mainTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
          showTab(e.currentTarget.dataset.tab);
      });
  });

  backToMethodsBtn.addEventListener('click', () => {
      showTab('methods'); 
  });

  // --- Content Rendering for "O‘quv ishlari bo‘yicha" (Learning Activities) ---

  function renderEducationalContent() {
      const currentEducationalFilesList = document.getElementById('educationalFilesList');
      const currentEducationalFileDetailArea = document.getElementById('educationalFileDetailArea');

      currentEducationalFilesList.innerHTML = ''; 
      currentEducationalFileDetailArea.innerHTML = '<h3>Tanlangan fayl ma\'lumotlari</h3><p>Fayl tanlang.</p>'; // Reset detail area

      if (uploadedFiles.length === 0) {
          currentEducationalFilesList.innerHTML += '<p>Hali yuklangan fayllar yo\'q.</p>';
          return;
      }

      uploadedFiles.forEach(file => {
          const card = document.createElement('div');
          card.className = 'simplified-file-item'; 
          card.dataset.id = file.id; 
          card.innerHTML = `
              <span>${file.uploaderName} - ${file.fileName}</span>
              <span>Holati: <span class="status-dot ${file.status}"></span></span>
          `;
          currentEducationalFilesList.appendChild(card);
      });

      document.querySelectorAll('#educationalFilesList .simplified-file-item').forEach(item => {
          item.addEventListener('click', (e) => {
              const fileId = parseInt(e.currentTarget.dataset.id);
              displaySelectedEducationalFileDetail(fileId);
          });
      });
  }

  // Displays full details of a selected file in the educational detail area (content_right)
  function displaySelectedEducationalFileDetail(id) {
      const file = uploadedFiles.find(f => f.id === id);
      const currentDetailArea = document.getElementById('educationalFileDetailArea'); 

      if (file && currentDetailArea) {
          let blobUrl = '#';
          let downloadButtonHtml = `<a class="download-button disabled-button" style="background-color: #555; cursor: not-allowed;">Yuklab olish mavjud emas</a>`;

          if (file.base64Data) {
              const fileBlob = base64toBlob(file.base64Data, getMimeType(file.fileName));
              if (fileBlob) {
                  blobUrl = URL.createObjectURL(fileBlob);
                  // YANGI: button elementidan foydalanish
                  downloadButtonHtml = `<a href="${blobUrl}" download="${file.fileName}" class="download-button">Yuklab olish</a>`;
              }
          }

          // YANGI: Grid-based layout for details
          currentDetailArea.innerHTML = `
              <div class="file-details-grid">
                  <h3 class="file-name-display">${file.fileName}</h3>
                  
                  <span class="grid-label">Qo'shuvchi:</span>
                  <span class="grid-value">${file.uploaderName}</span>
                  
                  <span class="grid-label">Yuklangan sana:</span>
                  <span class="grid-value">${file.uploadDate}</span>
                  
                  ${file.comment ? `
                      <span class="grid-label">Izoh:</span>
                      <span class="grid-value">${file.comment}</span>
                  ` : ''}
                  
                  <span class="grid-label">Holati:</span>
                  <span class="grid-value"><span class="status-dot ${file.status}"></span> ${file.status === 'green' ? 'Tasdiqlangan' : 'Tekshirilmoqda'}</span>
              </div>
              ${downloadButtonHtml}
          `;
      } else if (currentDetailArea) {
          currentDetailArea.innerHTML = '<h3>Ma\'lumot topilmadi</h3><p>Yuqoridagi ro\'yxatdan fayl tanlang.</p>';
      }
  }


  // --- Initial Load ---
  showTab('methods');
});