export async function init() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tab.id;
  
    const brightnessSlider = document.getElementById('brightness-slider');
    const contrastSlider = document.getElementById('contrast-slider');
    const toggle = document.getElementById('dimmer-toggle');
    const resetButton = document.getElementById('dimmer-reset-button');
  
    if (!brightnessSlider || !contrastSlider || !toggle || !resetButton) return;
  
    function applyFilter(enabled, brightness, contrast) {
      if (!enabled) {
        chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const style = document.getElementById('dimmer-style');
            if (style) style.remove();
            sessionStorage.setItem('dimmerEnabled', 'false');
          }
        });
      } else {
        chrome.scripting.executeScript({
          target: { tabId },
          func: (b, c) => {
            let style = document.getElementById('dimmer-style');
            if (!style) {
              style = document.createElement('style');
              style.id = 'dimmer-style';
              document.head.appendChild(style);
            }
            style.textContent = `
              html {
                filter: brightness(${1 + parseFloat(b)}) contrast(${1 + parseFloat(c)});
                transition: filter 0.3s ease;
              }
            `;
            sessionStorage.setItem('dimmerBrightness', b.toString());
            sessionStorage.setItem('dimmerContrast', c.toString());
            sessionStorage.setItem('dimmerEnabled', 'true');
          },
          args: [brightness, contrast]
        });
      }
    }
  
    const saved = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return {
          brightness: sessionStorage.getItem('dimmerBrightness') || '0',
          contrast: sessionStorage.getItem('dimmerContrast') || '0',
          enabled: sessionStorage.getItem('dimmerEnabled') === 'true'
        };
      }
    });
  
    const state = saved[0].result;
    brightnessSlider.value = state.brightness;
    contrastSlider.value = state.contrast;
    if (typeof state.enabled === 'undefined' || state.enabled === null) {
      toggle.classList.remove('on');
      brightnessSlider.disabled = true;
      contrastSlider.disabled = true;
      applyFilter(false, 0, 0);
    } else {
      toggle.classList.toggle('on', state.enabled);
      brightnessSlider.disabled = !state.enabled;
      contrastSlider.disabled = !state.enabled;
      applyFilter(state.enabled, state.brightness, state.contrast);
    }
  
    toggle.addEventListener('click', () => {
      const isOn = toggle.classList.toggle('on');
      brightnessSlider.disabled = !isOn;
      contrastSlider.disabled = !isOn;
      applyFilter(isOn, brightnessSlider.value, contrastSlider.value);
    });
  
    brightnessSlider.addEventListener('input', () => {
      if (toggle.classList.contains('on')) {
        applyFilter(true, brightnessSlider.value, contrastSlider.value);
      }
    });
  
    contrastSlider.addEventListener('input', () => {
      if (toggle.classList.contains('on')) {
        applyFilter(true, brightnessSlider.value, contrastSlider.value);
      }
    });
  
    resetButton.addEventListener('click', () => {
      brightnessSlider.value = 0;
      contrastSlider.value = 0;
      applyFilter(toggle.classList.contains('on'), 0, 0);
    });
  }
  