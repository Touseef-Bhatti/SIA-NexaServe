import { CONTACT_EMAIL } from './config.js';
import { initI18n, setLanguage, getLanguage, languageUrl, t } from '../i18n/index.js';
import '../styles/main.css';

const nav = document.querySelector('[data-navigation]');
if (nav) {
  const switcher = document.createElement('div');
  switcher.className = 'language-switcher';
  switcher.setAttribute('data-i18n-ignore', '');
  switcher.innerHTML = '<button class="language-toggle" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="language-options" aria-label="Change language" data-language-toggle><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg><span data-language-code>EN</span><span aria-hidden="true">&#8964;</span></button><div class="language-options" id="language-options" role="menu" hidden></div>';
  const options = switcher.querySelector('.language-options');
  for (const [code, label] of [['en', 'English'], ['lv', 'Latviešu']]) {
    const option = document.createElement('a');
    option.href = languageUrl(code); option.role = 'menuitem'; option.dataset.languageOption = code; option.textContent = label;
    option.addEventListener('click', (event) => { event.preventDefault(); setLanguage(code); close(); toggle.focus(); });
    options.append(option);
  }
  nav.insertBefore(switcher, nav.querySelector('.button'));
  const toggle = switcher.querySelector('button');
  const close = () => { toggle.setAttribute('aria-expanded', 'false'); options.hidden = true; };
  toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); options.hidden = !open; if (open) options.querySelector('[aria-current="true"]')?.focus(); });
  switcher.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { close(); toggle.focus(); return; }
    const items = [...options.querySelectorAll('[role="menuitem"]')];
    const current = items.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (options.hidden) { toggle.setAttribute('aria-expanded', 'true'); options.hidden = false; }
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  });
  document.addEventListener('click', (event) => { if (!switcher.contains(event.target)) close(); });
}
initI18n();

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
    const matchingOption = Array.from(serviceField.options).find((option) => option.value === requestedService);
    if (matchingOption) serviceField.value = matchingOption.value;
    if (requestedService === 'Future workforce needs') serviceField.value = 'Future workforce needs (subject to authorisation)';
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    if (!CONTACT_EMAIL) {
      status.textContent = getLanguage() === 'lv' ? 'Pieprasījuma forma ir gatava. Lai to aktivizētu, pievienojiet apstiprināto SIA NexaServe e-pasta adresi failā src/scripts/config.js.' : 'The enquiry form is ready. Add SIA NexaServe’s confirmed email address in src/scripts/config.js to activate it.';
      status.className = 'form-status form-status--notice';
      return;
    }

    const data = new FormData(form);
    const latvian = getLanguage() === 'lv';
    const serviceName = latvian ? t(String(data.get('service'))) : data.get('service');
    const subject = `${latvian ? 'Tīmekļvietnes pieprasījums' : 'Website enquiry'}: ${serviceName}`;
    const body = [
      `${latvian ? 'Vārds' : 'Name'}: ${data.get('name')}`,
      `${latvian ? 'Uzņēmums' : 'Company'}: ${data.get('company') || (latvian ? 'Nav norādīts' : 'Not provided')}`,
      `${latvian ? 'E-pasts' : 'Email'}: ${data.get('email')}`,
      `${latvian ? 'Pakalpojums' : 'Service'}: ${serviceName}`,
      '',
      latvian ? 'Ziņojums:' : 'Message:',
      data.get('message')
    ].join('\n');

    status.textContent = getLanguage() === 'lv' ? 'Tiks atvērta jūsu e-pasta lietotne ar sagatavotu ziņojumu.' : 'Your email application should open with the enquiry ready to send.';
    status.className = 'form-status form-status--success';
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
