window.adobeDataLayer = window.adobeDataLayer || [];

(function () {
  var path = window.location.pathname;
  var pageName = path.split('/').pop().replace('.html', '') || 'home';
  var titles = {
    'index': 'Home',
    'home': 'Home',
    'plans': 'Plans & Coverage',
    'doctors': 'Find a Doctor',
    'pharmacy': 'Pharmacy',
    'login': 'Member Sign In',
    'appointments': 'Appointments',
    'dashboard': 'Member Dashboard',
    'register-start': 'Registration - Step 1',
    'register-complete': 'Registration - Step 2',
    'journey': 'New Member Welcome Journey'
  };

  window.adobeDataLayer.push({
    event: 'page-load',
    page: {
      name: titles[pageName] || pageName,
      path: path,
      url: window.location.href
    }
  });
})();
