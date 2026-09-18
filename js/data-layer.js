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
    'register-start': Math.random() < 0.5 ? 'Registration - Step 1' : 'Registration -- Step 1',
    'register-complete': 'Registration - Step 2',
    'journey': 'New Member Welcome Journey',
    'wellness': 'Wellness Hub',
    'article-heart-habits': '5 Morning Habits That Support Heart Health',
    'article-preventive-visit': 'Making the Most of Your Annual Wellness Visit',
    'article-mediterranean-diet': 'The Mediterranean Approach to Eating Well',
    'article-workplace-stress': 'Managing Stress Before It Manages You',
    'article-sleep-hygiene': 'Sleep Better, Live Better: A Science-Based Guide',
    'article-walking-fitness': 'Walk Your Way to Better Health',
    'article-diabetes-prevention': 'Diabetes Prevention: Your Daily Choices Matter',
    'article-mindfulness': '5-Minute Mindfulness Practices for Busy Lives',
    'article-rx-coverage': 'Understanding Your Prescription Drug Coverage',
    'article-hydration': 'The Case for Drinking More Water'
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
