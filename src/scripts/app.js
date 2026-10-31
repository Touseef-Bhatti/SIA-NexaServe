import { CONTACT_EMAIL } from './config.js';
import '../styles/main.css';

const menuButton = document.querySelector('[data-menu-toggle]');
const navigation = document.querySelector('[data-navigation]');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
  });

  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    }
  });
}

document.querySelectorAll('[data-year]').forEach((item) => {
  item.textContent = new Date().getFullYear();
});

const form = document.querySelector('[data-contact-form]');
if (form) {
  const status = form.querySelector('[data-form-status]');
  const requestedService = new URLSearchParams(window.location.search).get('service');
  const serviceField = form.elements.namedItem('service');
  if (requestedService && serviceField) {
    const matchingOption = Array.from(serviceField.options).find((option) => option.text === requestedService);
    if (matchingOption) serviceField.value = matchingOption.value;
    if (requestedService === 'Future workforce needs') serviceField.value = 'Future workforce needs (subject to authorisation)';
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    if (!CONTACT_EMAIL) {
      status.textContent = 'The enquiry form is ready. Add SIA NexaServe’s confirmed email address in src/scripts/config.js to activate it.';
      status.className = 'form-status form-status--notice';
      return;
    }

    const data = new FormData(form);
    const subject = `Website enquiry: ${data.get('service')}`;
    const body = [
      `Name: ${data.get('name')}`,
      `Company: ${data.get('company') || 'Not provided'}`,
      `Email: ${data.get('email')}`,
      `Service: ${data.get('service')}`,
      '',
      'Message:',
      data.get('message')
    ].join('\n');

    status.textContent = 'Your email application should open with the enquiry ready to send.';
    status.className = 'form-status form-status--success';
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
