document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const tabButtons = document.querySelectorAll('.tab-button');
  
    const tabModules = {
      dimmer: './modules/dimmer.js',
      bass: './modules/bass.js'
    };
  
    function loadModule(tabName) {
      const modulePath = tabModules[tabName];
      if (modulePath) {
        import(modulePath)
          .then(module => {
            if (typeof module.init === 'function') {
              module.init();
            }
          })
          .catch(err => console.error(`Erro ao carregar o módulo "${tabName}":`, err));
      }
    }
  
    function activateTab(tabId) {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabs.forEach(tab => tab.classList.remove('active'));
  
      const button = Array.from(tabButtons).find(btn => btn.getAttribute('data-tab') === tabId);
      if (button) {
        button.classList.add('active');
      }
      const tab = document.getElementById(`${tabId}-tab`);
      if (tab) {
        tab.classList.add('active');
      }
      loadModule(tabId);
    }
  
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        activateTab(tabId);
        chrome.storage.local.set({ activeTab: tabId });
      });
    });
  
    chrome.storage.local.get(['activeTab'], (result) => {
      const activeTab = result.activeTab || 'dimmer';
      activateTab(activeTab);
    });
  });
  