document.addEventListener('DOMContentLoaded', () => {
  const deleteForm = document.getElementById('deleteForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  
  const agreeTerms = document.getElementById('agreeTerms');
  const agreeDelete = document.getElementById('agreeDelete');
  const agreeUndone = document.getElementById('agreeUndone');
  
  const submitBtn = document.getElementById('submitBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = submitBtn.querySelector('.btn-text');
  
  const deleteCard = document.getElementById('deleteCard');
  const successCard = document.getElementById('successCard');
  
  const modalOverlay = document.getElementById('modalOverlay');
  const modalErrorMsg = document.getElementById('modalErrorMsg');
  const closeModalBtn = document.getElementById('closeModalBtn');
  
  // Errors elements
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');

  // Input helper to clear errors on typing
  const inputs = [emailInput, passwordInput, confirmPasswordInput];
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      clearError(input);
    });
  });

  const checkboxes = [agreeTerms, agreeDelete, agreeUndone];
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      validateCheckboxesState();
    });
  });

  // Modal controls
  const showErrorModal = (message) => {
    modalErrorMsg.textContent = message;
    modalOverlay.classList.remove('hide');
  };

  const hideErrorModal = () => {
    modalOverlay.classList.add('hide');
  };

  closeModalBtn.addEventListener('click', hideErrorModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      hideErrorModal();
    }
  });

  // Validation helpers
  function showError(input, element, message) {
    input.style.borderColor = '#ef4444';
    input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
    element.textContent = message;
  }

  function clearError(input) {
    input.style.borderColor = '';
    input.style.boxShadow = '';
    
    if (input.id === 'email') emailError.textContent = '';
    if (input.id === 'password') passwordError.textContent = '';
    if (input.id === 'confirmPassword') confirmPasswordError.textContent = '';
  }

  function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  }

  function validateCheckboxesState() {
    const allChecked = agreeTerms.checked && agreeDelete.checked && agreeUndone.checked;
    // We don't disable the button visually, but we can give it subtle style cues if needed.
    return allChecked;
  }

  // Form submission handler
  deleteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset errors
    let isValid = true;
    clearError(emailInput);
    clearError(passwordInput);
    clearError(confirmPasswordInput);

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validate email
    if (!email) {
      showError(emailInput, emailError, "Email manzilingizni kiriting.");
      isValid = false;
    } else if (!validateEmail(email)) {
      showError(emailInput, emailError, "Noto'g'ri email formati kiritildi.");
      isValid = false;
    }

    // Validate password
    if (!password) {
      showError(passwordInput, passwordError, "Parolni kiriting.");
      isValid = false;
    } else if (password.length < 6) {
      showError(passwordInput, passwordError, "Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      isValid = false;
    }

    // Validate password confirmation
    if (!confirmPassword) {
      showError(confirmPasswordInput, confirmPasswordError, "Parolni qayta tasdiqlang.");
      isValid = false;
    } else if (password !== confirmPassword) {
      showError(confirmPasswordInput, confirmPasswordError, "Parollar mos kelmadi.");
      isValid = false;
    }

    // Validate checkboxes
    if (!agreeTerms.checked || !agreeDelete.checked || !agreeUndone.checked) {
      showErrorModal("Davom etish uchun barcha ogohlantirish va tasdiqlarni belgilashingiz zarur.");
      isValid = false;
    }

    if (!isValid) return;

    // Show loading state
    setLoading(true);

    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          agreeTerms: agreeTerms.checked,
          agreeDelete: agreeDelete.checked,
          agreeUndone: agreeUndone.checked
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Transition to success card
        deleteCard.classList.add('hide');
        successCard.classList.remove('hide');
      } else {
        // Show error message returned by server
        showErrorModal(result.error || "Kutilmagan xatolik yuz berdi.");
        setLoading(false);
      }

    } catch (error) {
      showErrorModal("Server bilan bog'lanishda xatolik yuz berdi. Internet aloqasini tekshiring.");
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnSpinner.style.display = 'block';
      btnText.style.opacity = '0';
      deleteForm.classList.add('disabled-form');
    } else {
      submitBtn.disabled = false;
      btnSpinner.style.display = 'none';
      btnText.style.opacity = '1';
      deleteForm.classList.remove('disabled-form');
    }
  }
});
