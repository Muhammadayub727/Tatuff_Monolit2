// DOM elementlarni olish
const addCardButton = document.getElementById('addCardButton');
const modalOverlay = document.getElementById('modalOverlay');
const teacherForm = document.getElementById('teacherForm');
const teacherList = document.getElementById('teacherList');
const teacherDetail = document.getElementById('teacherDetail');

let teachers = [];
let selectedTeacherIndex = null;

// Modalni ochish
addCardButton.addEventListener('click', () => {
  modalOverlay.style.display = 'flex';
});

// Modalni yopish (modaldan tashqariga bosilganda)
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// Modalni yopish funksiyasi
function closeModal() {
  modalOverlay.style.display = 'none';
  teacherForm.reset();
  clearValidation();
  // telefon inputini +998 bilan boshlash
  inputs.phoneNumber.value = "+998";
}

// Validation uchun inputlar
const inputs = {
  firstName: document.getElementById('firstName'),
  surname: document.getElementById('surname'),
  phoneNumber: document.getElementById('phoneNumber'),
  photoUpload: document.getElementById('photoUpload')
};

// Telefon inputiga default +998 qo'yish
inputs.phoneNumber.value = "+998";

// Telefon input uchun max 9 raqam va +998 prefiks bilan cheklash
inputs.phoneNumber.addEventListener('input', (e) => {
  const input = e.target;
  // Faqat raqamlarni ajratamiz
  let cleaned = input.value.replace(/\D/g, '');

  // +998 ni boshida saqlaymiz
  if (!cleaned.startsWith("998")) {
    cleaned = "998" + cleaned;
  }

  // Maksimum uzunlik 12 (998 + 9 raqam)
  cleaned = cleaned.slice(0, 12);

  input.value = '+' + cleaned;

  // Border rangini o'zgartirish validatsiya uchun
  if (cleaned.length === 12) {
    input.style.borderColor = '#4a64e0';
  } else {
    input.style.borderColor = 'red';
  }
});

// +998 qismini o'chirishga yo'l qo'ymaslik
inputs.phoneNumber.addEventListener('keydown', (e) => {
  if (inputs.phoneNumber.selectionStart < 4 && 
      (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft')) {
    e.preventDefault();
  }
});

// Inputlarni validatsiya qilish
function validateInput(input) {
  if (!input.value.trim()) {
    input.style.borderColor = 'red';
    return false;
  } else {
    input.style.borderColor = '#4a64e0';
    return true;
  }
}

// Telefon raqam uchun max 9 raqam borligini tekshirish
function validatePhoneNumber(input) {
  const val = input.value.replace(/\D/g, '');
  if (val.length === 12) { // 998 + 9 raqam
    input.style.borderColor = '#4a64e0';
    return true;
  } else {
    input.style.borderColor = 'red';
    return false;
  }
}

// Rasm inputini validatsiya qilish
function validateFileInput(input) {
  if (!input.files || input.files.length === 0) {
    input.style.borderColor = 'red';
    return false;
  } else {
    input.style.borderColor = '#4a64e0';
    return true;
  }
}

// Barcha inputlarni tozalash
function clearValidation() {
  Object.values(inputs).forEach(input => input.style.borderColor = '#ccc');
}

// Har bir inputga event qo'shish (real vaqt validatsiya uchun)
Object.values(inputs).forEach(input => {
  input.addEventListener('input', () => {
    if (input === inputs.phoneNumber) {
      validatePhoneNumber(input);
    } else if (input.type === 'file') {
      validateFileInput(input);
    } else {
      validateInput(input);
    }
  });
});

// LocalStoragega saqlash
function saveTeachersToLocalStorage() {
  localStorage.setItem('teachers', JSON.stringify(teachers));
}

// LocalStoragedan yuklash
function loadTeachersFromLocalStorage() {
  const data = localStorage.getItem('teachers');
  if (data) {
    teachers = JSON.parse(data);
    renderTeacherList();
  }
}

// Formani yuborish eventi
teacherForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Validatsiya
  let valid = true;
  valid = validateInput(inputs.firstName) && valid;
  valid = validateInput(inputs.surname) && valid;
  valid = validatePhoneNumber(inputs.phoneNumber) && valid;
  valid = validateFileInput(inputs.photoUpload) && valid;

  if (!valid) return;

  // Rasmdan URL yaratish (preview uchun)
  const photoFile = inputs.photoUpload.files[0];
  const photoURL = URL.createObjectURL(photoFile);

  // O'qituvchi ma'lumotlarini obyektda saqlash
  const newTeacher = {
    firstName: inputs.firstName.value.trim(),
    surname: inputs.surname.value.trim(),
    phoneNumber: inputs.phoneNumber.value.trim(),
    photoURL
  };

  teachers.push(newTeacher);
  saveTeachersToLocalStorage();

  // Ro'yxatni yangilash va modalni yopish
  renderTeacherList();
  closeModal();
});

// O'qituvchilar ro'yxatini chizish
function renderTeacherList() {
  teacherList.innerHTML = '';

  teachers.forEach((teacher, index) => {
    const div = document.createElement('div');
    div.classList.add('teacher-card');
    div.textContent = teacher.firstName.charAt(0).toUpperCase() + teacher.firstName.slice(1);
    div.addEventListener('click', () => {
      selectedTeacherIndex = index;
      renderTeacherDetail();
    });

    teacherList.appendChild(div);
  });

  // Agar birinchi o'qituvchi mavjud bo'lsa va hali tanlanmagan bo'lsa, uni avtomatik tanla
  if (teachers.length > 0 && selectedTeacherIndex === null) {
    selectedTeacherIndex = 0;
    renderTeacherDetail();
  }
}

// Tanlangan o'qituvchi tafsilotlarini chizish
function renderTeacherDetail() {
  if (selectedTeacherIndex === null) {
    teacherDetail.innerHTML = '<p>O\'qituvchi tanlang</p>';
    return;
  }

  const teacher = teachers[selectedTeacherIndex];
  teacherDetail.innerHTML = `
    <div class="teacher-info">
      <div class="teacher-meta">
        <img src="${teacher.photoURL}" alt="Teacher photo" />
        <div class="teacher-text">
          <p><strong>Ism:</strong> ${teacher.firstName} ${teacher.surname}</p>
          <p><strong>Telefon:</strong> ${teacher.phoneNumber}</p>
        </div>
      </div>
    </div>
  `;
}

// Enter tugmasi bilan qo‘shish uchun formaga event
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && modalOverlay.style.display === 'flex') {
    teacherForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }
});

// Sahifa yuklanganda localStoragedan yuklash
window.addEventListener('load', () => {
  loadTeachersFromLocalStorage();
  teacherDetail.innerHTML = "<p>O'qituvchi tanlang</p>";
});
