document.addEventListener('DOMContentLoaded', () => {
  const mainTabsContainer = document.getElementById('mainTabs');
  const educationalActivityTabsContainer = document.getElementById('educationalActivityTabs');
  const allTabContents = document.querySelectorAll('.tab-content');
  const mainTabs = document.querySelectorAll('#mainTabs li');
  const backToMethodsBtn = document.getElementById('backToMethods');

  const fileUploadContainerMethods = document.getElementById('fileUploadContainer-methods');
  const fileDetailsContainerMethods = document.getElementById('fileDetailsContainer-methods');
  const fileUploadContainerResearch = document.getElementById('fileUploadContainer-research');
  const fileDetailsContainerResearch = document.getElementById('fileDetailsContainer-research');
  const fileUploadContainerSpiritual = document.getElementById('fileUploadContainer-spiritual');
  const fileDetailsContainerSpiritual = document.getElementById('fileDetailsContainer-spiritual');

  const educationalFilesList = document.getElementById('educationalFilesList'); 
  const educationalFileDetailArea = document.getElementById('educationalFileDetailArea');

  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

  let currentActiveTab = 'methods';
  let fileToEditId = null; 

  const ALLOWED_EXTENSIONS = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.pdf', '.txt', '.exe', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
  const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
  const MAX_FILE_SIZE_MB = 500; 
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  function saveFilesToLocalStorage(key, files) {
      localStorage.setItem(key, JSON.stringify(files));
  }

  function loadFilesFromLocalStorage(key) {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
  }

  function getFilesForTab(tabName) {
      if (tabName === 'methods') return loadFilesFromLocalStorage('methodsFiles');
      if (tabName === 'research') return loadFilesFromLocalStorage('researchFiles');
      if (tabName === 'spiritual') return loadFilesFromLocalStorage('spiritualFiles');
      return [];
  }

  function setFilesForTab(tabName, files) {
      if (tabName === 'methods') saveFilesToLocalStorage('methodsFiles', files);
      if (tabName === 'research') saveFilesToLocalStorage('researchFiles', files);
      if (tabName === 'spiritual') saveFilesToLocalStorage('spiritualFiles', files);
  }

  function renderFileUploadForm(targetContainerId, isEditMode = false, fileData = null) {
      let uploaderName = fileData ? fileData.uploaderName : '';
      let comment = fileData ? fileData.comment : '';
      let submitButtonText = isEditMode ? 'Yangilash' : 'Yuklash';
      let fileInputRequired = !isEditMode || (isEditMode && !fileData?.base64Data);

      const formHtml = `
          <form id="fileUploadForm-${targetContainerId}" class="file-upload-form">
              <div class="form-group">
                  <label for="uploaderName-${targetContainerId}">Fayl qo'shuvchi (Ism, Familiya):</label>
                  <input type="text" id="uploaderName-${targetContainerId}" placeholder="Ismingiz va Familiyangiz" value="${uploaderName}" required />
              </div>
              <div class="form-group">
                  <label for="fileInput-${targetContainerId}">Fayl tanlang:</label>
                  <input type="file" id="fileInput-${targetContainerId}" accept="${ALLOWED_EXTENSIONS.join(',')}" ${fileInputRequired ? 'required' : ''} />
                  <small style="color: #ccc; font-size: 0.8em; margin-top: 5px;">Rasm fayllari (jpg, png, gif) va hujjatlar (doc, pdf, xls, ppt) yuklashga ruxsat berilgan.</small>
                  <small style="color: #ccc; font-size: 0.8em; margin-top: 5px;">Maksimal fayl hajmi: ${MAX_FILE_SIZE_MB}MB.</small>
              </div>
              <div class="form-group">
                  <label for="comment-${targetContainerId}">Izoh:</label>
                  <textarea id="comment-${targetContainerId}" placeholder="Fayl haqida izoh yozing">${comment}</textarea>
              </div>
              <button type="submit" class="file-upload-button">${submitButtonText}</button>
          </form>
      `;
      document.getElementById(targetContainerId).innerHTML = formHtml;

      const form = document.getElementById(`fileUploadForm-${targetContainerId}`);
      form.onsubmit = (e) => handleFileUpload(e, targetContainerId.replace('fileUploadContainer-', ''));
  }

  async function handleFileUpload(event, tabName) {
      event.preventDefault();

      const uploaderNameInput = document.getElementById(`uploaderName-fileUploadContainer-${tabName}`);
      const fileInput = document.getElementById(`fileInput-fileUploadContainer-${tabName}`);
      const commentInput = document.getElementById(`comment-fileUploadContainer-${tabName}`);

      const uploaderName = uploaderNameInput.value.trim();
      const comment = commentInput.value.trim();
      const file = fileInput.files[0];

      if (!uploaderName) {
          alert("Fayl qo'shuvchi ismini kiriting.");
          return;
      }

      let currentFiles = getFilesForTab(tabName);
      let existingFile = fileToEditId ? currentFiles.find(f => f.id === fileToEditId) : null;

      if (!file && !existingFile) {
          alert("Iltimos, faylni tanlang.");
          return;
      }

      let fileBase64 = existingFile ? existingFile.base64Data : null;
      let fileName = existingFile ? existingFile.fileName : null;
      let fileSize = existingFile ? existingFile.fileSize : null;
      let fileExtension = existingFile ? ('.' + existingFile.fileName.split('.').pop().toLowerCase()) : null;
      let isImage = existingFile ? existingFile.isImage : false;

      if (file) {
          fileExtension = '.' + file.name.split('.').pop().toLowerCase();
          if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
              alert(`Faqat ${ALLOWED_EXTENSIONS.join(', ')} fayllarini yuklashingiz mumkin.`);
              return;
          }

          if (file.size > MAX_FILE_SIZE_BYTES) {
              alert(`Fayl hajmi ${MAX_FILE_SIZE_MB}MB dan oshmasligi kerak. Sizning faylingiz hajmi: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
              return;
          }

          fileBase64 = await readFileAsBase64(file);
          fileName = file.name;
          fileSize = file.size;
          isImage = IMAGE_EXTENSIONS.includes(fileExtension);
      } else if (!existingFile) {
           alert("Iltimos, faylni tanlang.");
           return;
      }
      
      let fileStatus = 'red'; 
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
              fileStatus = Math.random() < 0.5 ? 'green' : 'red'; 
          }
      } else {
          fileStatus = Math.random() < 0.6 ? 'green' : 'red'; 
      }

      if (fileToEditId !== null) {
          const index = currentFiles.findIndex(f => f.id === fileToEditId);
          if (index > -1) {
              currentFiles[index] = {
                  id: existingFile.id,
                  uploaderName: uploaderName,
                  comment: comment,
                  status: fileStatus,
                  uploadDate: existingFile.uploadDate,
                  base64Data: fileBase64, 
                  fileName: fileName,
                  fileSize: fileSize,
                  isImage: isImage
              };
          }
          fileToEditId = null; 
      } else {
          const newFile = {
              id: Date.now(), 
              uploaderName: uploaderName,
              fileName: fileName,
              fileSize: fileSize,
              uploadDate: new Date().toLocaleString(),
              comment: comment,
              status: fileStatus, 
              base64Data: fileBase64,
              isImage: isImage
          };
          currentFiles.push(newFile);
      }

      setFilesForTab(tabName, currentFiles);
      renderFileCards(tabName); 
      renderFileUploadForm(`fileUploadContainer-${tabName}`); 
      updateEducationalContent();
  }

  function readFileAsBase64(file) {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(file);
      });
  }

  function renderFileCards(tabName) {
      const targetContainer = document.getElementById(`fileDetailsContainer-${tabName}`);
      let filesToDisplay = getFilesForTab(tabName);
      
      targetContainer.innerHTML = tabName === 'methods' ? '<h2>Yuklangan fayllar</h2>' : '<h2>Yuklangan fayllar/Rasmlar</h2>';
      
      if (filesToDisplay.length === 0) {
          targetContainer.innerHTML += '<p>Hali yuklangan fayllar yo\'q.</p>';
          return;
      }

      filesToDisplay.forEach(file => {
          let blobUrl = '#'; 
          let downloadLinkOrImageHtml = `<a class="download-button disabled-button">Yuklab olish mavjud emas</a>`; 

          if (file.base64Data) {
              if (file.isImage) {
                  downloadLinkOrImageHtml = `<img src="${file.base64Data}" alt="${file.fileName}" class="file-image-preview">`;
              } else {
                  const fileBlob = base64toBlob(file.base64Data, getMimeType(file.fileName));
                  if (fileBlob) { 
                      blobUrl = URL.createObjectURL(fileBlob);
                      downloadLinkOrImageHtml = `<a href="${blobUrl}" download="${file.fileName}" class="download-button">Yuklab olish</a>`;
                  }
              }
          }

          const card = document.createElement('div');
          card.className = 'file-card';
          card.dataset.id = file.id; 
          card.dataset.tab = tabName;

          card.innerHTML = `
              <h3>${file.fileName}</h3>
              <p class="uploader-info">Qo'shuvchi: ${file.uploaderName} | Yuklangan sana: ${file.uploadDate}</p>
              ${file.comment ? `<p class="comment-text">Izoh: ${file.comment}</p>` : ''}
              <p>Holati: <span class="status-dot ${file.status}"></span> ${file.status === 'green' ? 'Tasdiqlangan' : 'Tekshirilmoqda'}</p>
              ${downloadLinkOrImageHtml}
              <div class="action-icons">
                  <span class="material-symbols-outlined edit-icon" data-id="${file.id}" data-tab="${tabName}">edit</span>
                  <span class="material-symbols-outlined delete-icon" data-id="${file.id}" data-tab="${tabName}">delete</span>
              </div>
          `;
          targetContainer.appendChild(card);
          
          if (blobUrl !== '#') {
              card.dataset.blobUrl = blobUrl;
          }
      });

      document.querySelectorAll(`#fileDetailsContainer-${tabName} .edit-icon`).forEach(icon => {
          icon.onclick = (e) => {
              fileToEditId = parseInt(e.target.dataset.id);
              const currentTabForEdit = e.target.dataset.tab;
              const files = getFilesForTab(currentTabForEdit);
              const fileData = files.find(f => f.id === fileToEditId);
              renderFileUploadForm(`fileUploadContainer-${currentTabForEdit}`, true, fileData);
          };
      });

      document.querySelectorAll(`#fileDetailsContainer-${tabName} .delete-icon`).forEach(icon => {
          icon.onclick = (e) => {
              fileToDeleteId = parseInt(e.target.dataset.id);
              const currentTabForDelete = e.target.dataset.tab;
              showDeleteConfirmationModal(currentTabForDelete);
          };
      });
  }

  function base64toBlob(base64, mimeType) {
      if (!base64 || typeof base64 !== 'string' || !base64.includes(',')) {
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
          case 'jpg': case 'jpeg': return 'image/jpeg';
          case 'png': return 'image/png';
          case 'gif': return 'image/gif';
          case 'bmp': return 'image/bmp';
          case 'svg': return 'image/svg+xml';
          case 'webp': return 'image/webp';
          default: return 'application/octet-stream'; 
      }
  }

  function showDeleteConfirmationModal(tabName) {
      deleteModalOverlay.dataset.tab = tabName; 
      deleteModalOverlay.style.display = 'flex';
  }

  function hideDeleteConfirmationModal() {
      deleteModalOverlay.style.display = 'none';
      fileToDeleteId = null; 
      delete deleteModalOverlay.dataset.tab;
  }

  confirmDeleteBtn.onclick = () => {
      if (fileToDeleteId !== null) {
          const tabName = deleteModalOverlay.dataset.tab;
          deleteFile(fileToDeleteId, tabName);
          hideDeleteConfirmationModal();
      }
  };

  cancelDeleteBtn.onclick = () => {
      hideDeleteConfirmationModal();
  };

  deleteModalOverlay.onclick = (e) => {
      if (e.target === deleteModalOverlay) {
          hideDeleteConfirmationModal();
      }
  };

  function deleteFile(id, tabName) {
      let files = getFilesForTab(tabName);
      const cardToDelete = document.querySelector(`.file-card[data-id="${id}"][data-tab="${tabName}"]`);
      if (cardToDelete && cardToDelete.dataset.blobUrl) {
          URL.revokeObjectURL(cardToDelete.dataset.blobUrl);
      }

      files = files.filter(file => file.id !== id);
      setFilesForTab(tabName, files);
      renderFileCards(tabName); 
      updateEducationalContent();
      renderFileUploadForm(`fileUploadContainer-${tabName}`); 
  }

  function showTab(tabName) {
      allTabContents.forEach(content => {
          content.classList.remove('active-tab');
          content.style.display = 'none'; 
      });

      mainTabsContainer.classList.add('hidden');
      educationalActivityTabsContainer.classList.add('hidden');
      currentActiveTab = tabName; 
      fileToEditId = null; 

      if (tabName === 'educational') {
          document.getElementById('educationalContent').classList.add('active-tab');
          document.getElementById('educationalContent').style.display = 'flex'; 

          educationalActivityTabsContainer.classList.remove('hidden');
          updateEducationalContent(); 
      } else {
          document.getElementById(`${tabName}Content`).classList.add('active-tab');
          document.getElementById(`${tabName}Content`).style.display = 'flex'; 

          mainTabsContainer.classList.remove('hidden');
          mainTabs.forEach(t => t.classList.remove('active'));
          document.querySelector(`#mainTabs li[data-tab="${tabName}"]`).classList.add('active');
          
          renderFileUploadForm(`fileUploadContainer-${tabName}`);
          renderFileCards(tabName);
      }
  }

  mainTabs.forEach(tab => {
      tab.onclick = (e) => {
          showTab(e.currentTarget.dataset.tab);
      };
  });

  backToMethodsBtn.onclick = () => {
      showTab('methods'); 
  };

  function updateEducationalContent() {
      const methodsFiles = loadFilesFromLocalStorage('methodsFiles');
      const researchFiles = loadFilesFromLocalStorage('researchFiles');
      const spiritualFiles = loadFilesFromLocalStorage('spiritualFiles');
      const allDisplayFiles = [...methodsFiles, ...researchFiles, ...spiritualFiles].sort((a, b) => b.id - a.id); // Eng yangilar tepada

      educationalFilesList.innerHTML = ''; 
      educationalFileDetailArea.innerHTML = '<h3>Tanlangan fayl ma\'lumotlari</h3><p>Fayl tanlang.</p>'; 

      if (allDisplayFiles.length === 0) {
          educationalFilesList.innerHTML += '<p>Hali yuklangan fayllar yo\'q.</p>';
          return;
      }

      allDisplayFiles.forEach(file => {
          const card = document.createElement('div');
          card.className = 'simplified-file-item'; 
          card.dataset.id = file.id; 
          card.dataset.originalTab = file.originalTab || (file.isImage ? 'research/spiritual' : 'methods'); // Qaysi tabdan kelganini taxmin qilish

          card.innerHTML = `
              <span>${file.uploaderName} - ${file.fileName}</span>
              <span>Holati: <span class="status-dot ${file.status}"></span></span>
          `;
          educationalFilesList.appendChild(card);
      });

      document.querySelectorAll('#educationalFilesList .simplified-file-item').forEach(item => {
          item.onclick = (e) => {
              const fileId = parseInt(e.currentTarget.dataset.id);
              displaySelectedEducationalFileDetail(fileId);
          };
      });
  }

  function displaySelectedEducationalFileDetail(id) {
      const methodsFiles = loadFilesFromLocalStorage('methodsFiles');
      const researchFiles = loadFilesFromLocalStorage('researchFiles');
      const spiritualFiles = loadFilesFromLocalStorage('spiritualFiles');
      const allDisplayFiles = [...methodsFiles, ...researchFiles, ...spiritualFiles];

      const file = allDisplayFiles.find(f => f.id === id);
      const currentDetailArea = document.getElementById('educationalFileDetailArea'); 

      if (file && currentDetailArea) {
          let blobUrl = '#';
          let downloadLinkOrImageHtml = `<a class="download-button disabled-button">Yuklab olish mavjud emas</a>`;

          if (file.base64Data) {
              if (file.isImage) {
                  downloadLinkOrImageHtml = `<img src="${file.base64Data}" alt="${file.fileName}" class="file-image-preview">`;
              } else {
                  const fileBlob = base64toBlob(file.base64Data, getMimeType(file.fileName));
                  if (fileBlob) {
                      blobUrl = URL.createObjectURL(fileBlob);
                      downloadLinkOrImageHtml = `<a href="${blobUrl}" download="${file.fileName}" class="download-button">Yuklab olish</a>`;
                  }
              }
          }

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
              ${downloadLinkOrImageHtml}
          `;
      } else if (currentDetailArea) {
          currentDetailArea.innerHTML = '<h3>Ma\'lumot topilmadi</h3><p>Yuqoridagi ro\'yxatdan fayl tanlang.</p>';
      }
  }

  showTab('methods');
});