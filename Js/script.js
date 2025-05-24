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
  const allFilesList = document.getElementById('allFilesList');
  const simplifiedFilesList = document.getElementById('simplifiedFilesList');
  const selectedFileDetail = document.getElementById('selectedFileDetail');

  // Modal elements
  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

  // Data and state variables
  let uploadedFiles = loadFilesFromLocalStorage();
  let fileToDeleteId = null; // To store the ID of the file to be deleted
  let fileToEditId = null;   // To store the ID of the file being edited

  // Allowed file extensions (non-image)
  const ALLOWED_EXTENSIONS = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.pdf', '.txt', '.exe'];

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
      // Only one form is rendered. It acts as both add and edit.
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
              </div>
              <div class="form-group">
                  <label for="comment">Izoh:</label>
                  <textarea id="comment" placeholder="Fayl haqida izoh yozing"></textarea>
              </div>
              <button type="submit" class="file-upload-button" id="submitFileBtn">Yuklash</button>
          </form>
      `;
      fileUploadContainer.innerHTML = formHtml; // Replace content

      const form = document.getElementById('fileUploadForm');
      form.addEventListener('submit', handleFileUpload);
      
      // If editing, populate the form
      if (fileToEditId !== null) {
          const file = uploadedFiles.find(f => f.id === fileToEditId);
          if (file) {
              document.getElementById('uploaderName').value = file.uploaderName;
              document.getElementById('comment').value = file.comment;
              document.getElementById('submitFileBtn').textContent = 'Yangilash';
              // fileInput remains empty, user can choose to re-upload or keep old
          }
      } else {
          document.getElementById('submitFileBtn').textContent = 'Yuklash';
      }
  }

  // Handles file upload or edit submission
  async function handleFileUpload(event) {
      event.preventDefault();

      const uploaderNameInput = document.getElementById('uploaderName');
      const fileInput = document.getElementById('fileInput');
      const commentInput = document.getElementById('comment');

      const uploaderName = uploaderNameInput.value.trim();
      const comment = commentInput.value.trim();
      const file = fileInput.files[0];

      // Basic validation
      if (!uploaderName) {
          alert("Iltimos, fayl qo'shuvchi ismini kiriting.");
          return;
      }

      if (fileToEditId === null && !file) { // If adding, file is required
          alert("Iltimos, faylni tanlang.");
          return;
      }

      let fileBase64 = null;
      let fileName = null;
      let fileSize = null;

      if (file) { // If a new file is selected (either adding or replacing during edit)
          const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
          if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
              alert(`Faqat ${ALLOWED_EXTENSIONS.join(', ')} fayllarini yuklashingiz mumkin.`);
              return;
          }

          // Read file as Base64 for local storage
          fileBase64 = await readFileAsBase64(file);
          fileName = file.name;
          fileSize = file.size;
      } else if (fileToEditId !== null) {
          // If editing and no new file is selected, retain existing file data
          const existingFile = uploadedFiles.find(f => f.id === fileToEditId);
          if (existingFile) {
              fileBase64 = existingFile.base64Data; // Keep old Base64
              fileName = existingFile.fileName;
              fileSize = existingFile.fileSize;
          }
      }


      // Simulate file content check for status (replace with actual logic if needed)
      const isFileGreen = (fileName?.toLowerCase().includes('safe') || comment.toLowerCase().includes('safe'));

      if (fileToEditId !== null) {
          // Edit existing file
          const index = uploadedFiles.findIndex(f => f.id === fileToEditId);
          if (index > -1) {
              const existingFile = uploadedFiles[index];
              uploadedFiles[index] = {
                  id: existingFile.id, // Keep original ID
                  uploaderName: uploaderName,
                  comment: comment,
                  status: isFileGreen ? 'green' : 'red',
                  uploadDate: existingFile.uploadDate, // Keep original upload date
                  // Update file data only if a new file was provided or if it's retained
                  base64Data: fileBase64, 
                  fileName: fileName,
                  fileSize: fileSize,
              };
          }
          fileToEditId = null; // Exit edit mode
      } else {
          // Add new file
          const newFile = {
              id: Date.now(), // Unique ID
              uploaderName: uploaderName,
              fileName: fileName,
              fileSize: fileSize,
              uploadDate: new Date().toLocaleString(),
              comment: comment,
              status: isFileGreen ? 'green' : 'red',
              base64Data: fileBase64 // Store Base64 data
          };
          uploadedFiles.push(newFile);
      }

      saveFilesToLocalStorage();
      renderFileCards(); // Update 'O'quv usullari' view
      renderFileUploadForm(); // Reset form
      renderEducationalContent(); // Update 'O‘quv ishlari bo‘yicha' view (if visible)
  }

  // Converts a File object to a Base64 string
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
      fileDetailsContainer.innerHTML = '<h2>Yuklangan fayllar</h2>'; // Clear previous content
      if (uploadedFiles.length === 0) {
          fileDetailsContainer.innerHTML += '<p>Hali yuklangan fayllar yo\'q.</p>';
          return;
      }

      uploadedFiles.forEach(file => {
          let blobUrl = '#'; // Default to a non-functional link
          let downloadLinkHtml = '<span style="color: #999;">Yuklab olish mavjud emas</span>'; // Default text if download not available

          if (file.base64Data) {
              const fileBlob = base64toBlob(file.base64Data, getMimeType(file.fileName));
              if (fileBlob) { // Ensure blob was successfully created
                  blobUrl = URL.createObjectURL(fileBlob);
                  downloadLinkHtml = `<a href="${blobUrl}" download="${file.fileName}" class="file-download-link" style="color: #4a64e0; text-decoration: none;">Yuklab olish</a>`;
              } else {
                  console.warn(`Could not create Blob for file ID ${file.id}. Download link will be disabled.`);
              }
          } else {
              console.warn(`File ID ${file.id} is missing base64Data. Download link will be disabled.`);
          }

          const card = document.createElement('div');
          card.className = 'file-card';
          card.innerHTML = `
              <h3>${file.fileName}</h3>
              <p class="uploader-info">Qo'shuvchi: ${file.uploaderName} | Yuklangan sana: ${file.uploadDate}</p>
              ${file.comment ? `<p class="comment-text">Izoh: ${file.comment}</p>` : ''}
              <p>Holati: <span class="status-dot ${file.status}"></span> ${file.status === 'green' ? 'Tasdiqlangan' : 'Tekshirilmoqda'}</p>
              ${downloadLinkHtml}
              <div class="action-icons">
                  <span class="material-symbols-outlined edit-icon" data-id="${file.id}">edit</span>
                  <span class="material-symbols-outlined delete-icon" data-id="${file.id}">delete</span>
              </div>
          `;
          fileDetailsContainer.appendChild(card);
          
          // Store blob URL if created, for potential revocation later
          if (blobUrl !== '#') {
              card.dataset.blobUrl = blobUrl;
          }
      });

      // Attach event listeners to new icons
      document.querySelectorAll('.edit-icon').forEach(icon => {
          icon.addEventListener('click', (e) => {
              fileToEditId = parseInt(e.target.dataset.id);
              renderFileUploadForm(); // Populate form for editing
          });
      });

      document.querySelectorAll('.delete-icon').forEach(icon => {
          icon.addEventListener('click', (e) => {
              fileToDeleteId = parseInt(e.target.dataset.id);
              showDeleteConfirmationModal();
          });
      });
  }

  // Helper to convert Base64 to Blob
  function base64toBlob(base64, mimeType) {
      // Robust check for valid base64 string
      if (!base64 || typeof base64 !== 'string' || !base64.includes(',')) {
          console.error("Invalid base64 string provided for Blob creation:", base64 ? base64.substring(0, 50) + "..." : "null/undefined"); // Log partial string for debug
          return null; // Return null if invalid
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
          return null; // Return null on error
      }
  }

  // Helper to get MIME type from file extension
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
          default: return 'application/octet-stream'; // Generic binary file
      }
  }

  // --- Delete Confirmation Modal Logic ---

  function showDeleteConfirmationModal() {
      deleteModalOverlay.style.display = 'flex';
  }

  function hideDeleteConfirmationModal() {
      deleteModalOverlay.style.display = 'none';
      fileToDeleteId = null; // Clear selected ID
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

  // Close modal if clicking outside
  deleteModalOverlay.addEventListener('click', (e) => {
      if (e.target === deleteModalOverlay) {
          hideDeleteConfirmationModal();
      }
  });

  // --- Delete Function ---
  function deleteFile(id) {
      // Revoke the object URL if it was created for the file being deleted
      const cardToDelete = document.querySelector(`.file-card .delete-icon[data-id="${id}"]`)?.closest('.file-card');
      if (cardToDelete && cardToDelete.dataset.blobUrl) {
          URL.revokeObjectURL(cardToDelete.dataset.blobUrl);
      }

      uploadedFiles = uploadedFiles.filter(file => file.id !== id);
      saveFilesToLocalStorage();
      renderFileCards(); // Update 'O'quv usullari' view
      if (document.getElementById('educationalContent').classList.contains('active-tab')) {
           renderEducationalContent(); // Update 'O‘quv ishlari bo‘yicha' view only if active
      }
      renderFileUploadForm(); // Reset/render form for next action
  }

  // --- Tab Switching Logic ---

  function showTab(tabName) {
      // Hide all content sections first
      allTabContents.forEach(content => content.classList.remove('active-tab'));

      // Hide both main and special tab containers
      mainTabsContainer.classList.add('hidden');
      educationalActivityTabsContainer.classList.add('hidden');

      // Show the appropriate content and tab container
      if (tabName === 'educational') {
          document.getElementById('educationalContent').classList.add('active-tab');
          educationalActivityTabsContainer.classList.remove('hidden');
          renderEducationalContent(); // Render content for this special view
      } else {
          // All other regular tabs
          document.getElementById(`${tabName}Content`).classList.add('active-tab');
          mainTabsContainer.classList.remove('hidden');
          // Set active class for the clicked tab
          mainTabs.forEach(t => t.classList.remove('active'));
          document.querySelector(`#mainTabs li[data-tab="${tabName}"]`).classList.add('active');
          
          // If it's the "O'quv usullari" tab, also render its specific content
          if (tabName === 'methods') {
              renderFileUploadForm();
              renderFileCards();
          }
      }
  }

  // Event listeners for main tabs
  mainTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
          showTab(e.currentTarget.dataset.tab);
      });
  });

  // Event listener for back button in special "O‘quv ishlari bo‘yicha" view
  backToMethodsBtn.addEventListener('click', () => {
      showTab('methods'); // Go back to "O'quv usullari"
  });

  // --- Content Rendering for "O‘quv ishlari bo‘yicha" (Learning Activities) ---

  function renderEducationalContent() {
      // Render the detailed list of files on the left panel
      allFilesList.innerHTML = ''; // Clear previous content
      simplifiedFilesList.innerHTML = '';
      selectedFileDetail.innerHTML = '<h3>Fayl haqida ma\'lumot</h3><p>Yuqoridagi ro\'yxatdan fayl tanlang.</p>'; // Reset detail area

      if (uploadedFiles.length === 0) {
          allFilesList.innerHTML += '<p>Hali yuklangan fayllar yo\'q.</p>';
          simplifiedFilesList.innerHTML += '<p>Hali yuklangan fayllar yo\'q.</p>';
          return;
      }

      // Left Panel: All Files Detailed
      uploadedFiles.forEach(file => {
          let blobUrl = '#';
          let downloadLinkHtml = '<span style="color: #999;">Yuklab olish mavjud emas</span>';

          if (file.base64Data) {
              const fileBlob = base64toBlob(file.base64Data, getMimeType(file.fileName));
              if (fileBlob) {
                  blobUrl = URL.createObjectURL(fileBlob);
                  downloadLinkHtml = `<a href="${blobUrl}" download="${file.fileName}" class="file-download-link" style="color: #4a64e0; text-decoration: none;">Yuklab olish</a>`;
              }
          }

          const card = document.createElement('div');
          card.className = 'file-card'; // Reuse file-card style
          card.innerHTML = `
              <h3>${file.fileName}</h3>
              <p class="uploader-info">Qo'shuvchi: ${file.uploaderName} | Yuklangan sana: ${file.uploadDate}</p>
              ${file.comment ? `<p class="comment-text">Izoh: ${file.comment}</p>` : ''}
              <p>Holati: <span class="status-dot ${file.status}"></span> ${file.status === 'green' ? 'Tasdiqlangan' : 'Tekshirilmoqda'}</p>
              ${downloadLinkHtml}
          `;
          allFilesList.appendChild(card);
      });

      // Right Panel: Simplified Files List
      uploadedFiles.forEach(file => {
          const card = document.createElement('div');
          card.className = 'methods-simplified-card';
          card.dataset.id = file.id; // Store ID for click listener
          card.innerHTML = `
              <span>${file.uploaderName}</span>
              <span>Holati: <span class="status-dot ${file.status}"></span></span>
          `;
          simplifiedFilesList.appendChild(card);
      });

      // Add click listeners to simplified cards
      document.querySelectorAll('.methods-simplified-card').forEach(card => {
          card.addEventListener('click', (e) => {
              const fileId = parseInt(e.currentTarget.dataset.id);
              displaySelectedFileDetail(fileId);
          });
      });
  }

  // Displays full details of a selected file on the right panel's detail area (in educational view)
  function displaySelectedFileDetail(id) {
      const file = uploadedFiles.find(f => f.id === id);
      if (file) {
          let blobUrl = '#';
          let downloadLinkHtml = '<span style="color: #999;">Yuklab olish mavjud emas</span>';

          if (file.base64Data) {
              const fileBlob = base64toBlob(file.base64Data, getMimeType(file.fileName));
              if (fileBlob) {
                  blobUrl = URL.createObjectURL(fileBlob);
                  downloadLinkHtml = `<a href="${blobUrl}" download="${file.fileName}" class="file-download-link" style="color: #4a64e0; text-decoration: none;">Yuklab olish</a>`;
              }
          }

          selectedFileDetail.innerHTML = `
              <h3>${file.fileName}</h3>
              <p class="uploader-info">Qo'shuvchi: ${file.uploaderName}</p>
              <p>Yuklangan sana: ${file.uploadDate}</p>
              ${file.comment ? `<p class="comment-text">Izoh: ${file.comment}</p>` : ''}
              <p>Holati: <span class="status-dot ${file.status}"></span> ${file.status === 'green' ? 'Tasdiqlangan' : 'Tekshirilmoqda'}</p>
              ${downloadLinkHtml}
          `;
      } else {
          selectedFileDetail.innerHTML = '<h3>Ma\'lumot topilmadi</h3><p>Yuqoridagi ro\'yxatdan fayl tanlang.</p>';
      }
  }

  // --- Initial Load ---
  // Show the default tab ('methods') when the page loads
  showTab('methods');
});