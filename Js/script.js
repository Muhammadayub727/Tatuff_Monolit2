// script.js
const addCardButton = document.getElementById('addCardButton');
const modalOverlay = document.getElementById('modalOverlay');
const teacherForm = document.getElementById('teacherForm');
const teacherList = document.getElementById('teacherList');
const teacherDetail = document.getElementById('teacherDetail');
const submitBtn = document.getElementById('submitBtn');

let teachers = [];
let selectedTeacherIndex = null;
let editingIndex = null;

const inputs = {
  firstName: document.getElementById('firstName'),
  surname: document.getElementById('surname'),
  phoneNumber: document.getElementById('phoneNumber'),
  photoUpload: document.getElementById('photoUpload')
};

inputs.phoneNumber.value = "+998";

inputs.phoneNumber.addEventListener('input', (e) => {
  let cleaned = e.target.value.replace(/\D/g, '');
  if (!cleaned.startsWith("998")) {
    cleaned = "998" + cleaned;
  }
  cleaned = cleaned.slice(0, 12);
  e.target.value = '+' + cleaned;
  e.target.style.borderColor = cleaned.length === 12 ? '#4a64e0' : 'red';
});

inputs.phoneNumber.addEventListener('keydown', (e) => {
  if (inputs.phoneNumber.selectionStart < 4 &&
      (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft')) {
    e.preventDefault();
  }
});

function validateInput(input) {
  if (!input.value.trim()) {
    input.style.borderColor = 'red';
    return false;
  } else {
    input.style.borderColor = '#4a64e0';
    return true;
  }
}

function validatePhoneNumber(input) {
  const val = input.value.replace(/\D/g, '');
  if (val.length === 12) {
    input.style.borderColor = '#4a64e0';
    return true;
  } else {
    input.style.borderColor = 'red';
    return false;
  }
}

function validateFileInput(input) {
  if (!input.files || input.files.length === 0) {
    input.style.borderColor = 'red';
    return false;
  } else {
    input.style.borderColor = '#4a64e0';
    return true;
  }
}

function clearValidation() {
  Object.values(inputs).forEach(input => input.style.borderColor = '#ccc');
}

Object.values(inputs).forEach(input => {
  input.addEventListener('input', () => {
    if (input === inputs.phoneNumber) validatePhoneNumber(input);
    else if (input.type === 'file') validateFileInput(input);
    else validateInput(input);
  });
});

function openModal(editIndex = null) {
  modalOverlay.style.display = 'flex';
  editingIndex = editIndex;

  if (editIndex !== null) {
    const teacher = teachers[editIndex];
    inputs.firstName.value = teacher.firstName;
    inputs.surname.value = teacher.surname;
    inputs.phoneNumber.value = teacher.phoneNumber;
  } else {
    teacherForm.reset();
    inputs.phoneNumber.value = '+998';
  }
}

function closeModal() {
  modalOverlay.style.display = 'none';
  teacherForm.reset();
  clearValidation();
  editingIndex = null;
  inputs.phoneNumber.value = '+998';
}

addCardButton.addEventListener('click', () => openModal());

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

teacherForm.addEventListener('submit', (e) => {
  e.preventDefault();

  let valid = validateInput(inputs.firstName) &&
              validateInput(inputs.surname) &&
              validatePhoneNumber(inputs.phoneNumber) &&
              (editingIndex !== null || validateFileInput(inputs.photoUpload));

  if (!valid) return;

  let photoURL;
  if (editingIndex === null) {
    const photoFile = inputs.photoUpload.files[0];
    photoURL = URL.createObjectURL(photoFile);
  } else {
    photoURL = teachers[editingIndex].photoURL;
  }

  const newTeacher = {
    firstName: inputs.firstName.value.trim(),
    surname: inputs.surname.value.trim(),
    phoneNumber: inputs.phoneNumber.value.trim(),
    photoURL
  };

  if (editingIndex !== null) {
    teachers[editingIndex] = newTeacher;
  } else {
    teachers.push(newTeacher);
  }

  saveTeachersToLocalStorage();
  renderTeacherList();
  closeModal();
});

function saveTeachersToLocalStorage() {
  localStorage.setItem('teachers', JSON.stringify(teachers));
}

function loadTeachersFromLocalStorage() {
  const data = localStorage.getItem('teachers');
  if (data) {
    teachers = JSON.parse(data);
    renderTeacherList();
  }
}

function renderTeacherList() {
  teacherList.innerHTML = '';
  teachers.forEach((teacher, index) => {
    const card = document.createElement('div');
    card.className = 'teacher-card';
    card.innerHTML = `
      <div class="status-dot"></div>
      <strong>${teacher.firstName}</strong>
      <div class="action-buttons">
      <span onclick=editTeacher(${index}) class="material-symbols-outlined" style=" color: #FFA500; position: fixed;margin-left: 20px;">edit</span>
      <span onclick=deleteTeacher(${index}) class="material-symbols-outlined" style="color: red;position: fixed; margin-left: 30px;">delete</span>
      
      </div>
    `;

    const statusDot = card.querySelector('.status-dot');
    statusDot.addEventListener('click', () => {
      statusDot.classList.toggle('active');
    });

    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        selectedTeacherIndex = index;
        renderTeacherDetail();
      }
    });

    teacherList.appendChild(card);
  });
}

function renderTeacherDetail() {
  if (selectedTeacherIndex === null) {
    document.querySelector('.right_top').innerHTML = "<p>O'qituvchi tanlang</p>";
    document.querySelector('.right_bottom').innerHTML = "";
    return;
  }

  const teacher = teachers[selectedTeacherIndex];

  document.querySelector('.right_top').innerHTML = `
    <div class="teacher-meta">
      <img src="${teacher.photoURL}" alt="Teacher photo" style="width:100px;height:100px;border-radius:50%;">
      <div class="teacher-text">
        <p><strong>Ism:</strong> ${teacher.firstName} ${teacher.surname}</p>
        <p><strong>Telefon:</strong> ${teacher.phoneNumber}</p>
      </div>
    </div>
  `;

  document.querySelector('.right_bottom').innerHTML = `
    <p>Qo‘shimcha ma’lumotlar joyi (agar kerak bo‘lsa)</p>
  `;
}

  const teacher = teachers[selectedTeacherIndex];
  teacherDetail.innerHTML = `
    <div class="teacher-info">
      <div class="teacher-meta">
        <img src="${teacher.photoURL}" alt="Teacher photo" style="width:200px;height:250px;">
        <div class="teacher-text">
          <p><strong>Ism:</strong> ${teacher.firstName} ${teacher.surname}</p>
          <p><strong>Telefon:</strong> ${teacher.phoneNumber}</p>
        </div>
      </div>
    </div>
  `;


function editTeacher(index) {
  openModal(index);
}

function deleteTeacher(index) {
  teachers.splice(index, 1);
  saveTeachersToLocalStorage();
  renderTeacherList();
  teacherDetail.innerHTML = '<p>O\'qituvchi tanlang</p>';
}

window.addEventListener('load', () => {
  loadTeachersFromLocalStorage();
  teacherDetail.innerHTML = "<p>O'qituvchi tanlang</p>";
});
