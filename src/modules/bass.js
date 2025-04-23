export async function init() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tab.id;
    const storageKey = `deepBass_${tabId}`;

    const bassSlider = document.getElementById('bass-slider');
    const toggle = document.getElementById('bass-toggle');
    const resetButton = document.getElementById('bass-reset-button');

    if (!bassSlider || !toggle || !resetButton) return;

    function isEnabled() {
        return toggle.classList.contains('on');
    }

    function setToggleState(state) {
        toggle.classList.toggle('on', state);
        bassSlider.disabled = !state;
    }

    function saveState(enabled, bass) {
        const data = {};
        data[storageKey] = { enabled, bass };
        chrome.storage.local.set(data, () => {
            applyBassBoost(tabId, enabled, parseFloat(bass));
        });
    }

    function applyBassBoost(tabId, enabled, bassLevel) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: "MAIN",
            func: async (enabled, bassLevel) => {
                try {
                    if (!window.deepBassContext) {
                        window.deepBassContext = new (window.AudioContext || window.webkitAudioContext)();
                        window.deepBassGain = window.deepBassContext.createGain();
                        window.deepBassFilter = window.deepBassContext.createBiquadFilter();
                        window.deepBassFilter.type = "lowshelf";
                        window.deepBassFilter.frequency.value = 200;
                        window.deepBassFilter.gain.value = bassLevel;

                        const connectAudio = () => {
                            setTimeout(() => {
                                const mediaElements = document.querySelectorAll("audio, video");
                                console.log('Found media elements:', mediaElements.length);
                                mediaElements.forEach((media) => {
                                    try {
                                        const source = window.deepBassContext.createMediaElementSource(media);
                                        source.connect(window.deepBassFilter);
                                        window.deepBassFilter.connect(window.deepBassGain);
                                        window.deepBassGain.connect(window.deepBassContext.destination);
                                    } catch (e) {
                                        console.error('Error connecting media element', e);
                                    }
                                });
                            }, 1000);
                        };

                        connectAudio();

                        const observer = new MutationObserver((mutations) => {
                            mutations.forEach((mutation) => {
                                mutation.addedNodes.forEach((node) => {
                                    if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
                                        try {
                                            console.log('Connecting new media element via MutationObserver', node);
                                            const source = window.deepBassContext.createMediaElementSource(node);
                                            source.connect(window.deepBassFilter);
                                        } catch (e) {
                                            console.error('Error connecting new media element', e);
                                        }
                                    }
                                });
                            });
                        });
                        observer.observe(document.body, { childList: true, subtree: true });
                    }

                    if (window.deepBassContext.state === 'suspended') {
                        await window.deepBassContext.resume();
                    }

                    if (enabled) {
                        window.deepBassFilter.gain.value = bassLevel;
                        console.log('Bass boost applied with gain:', bassLevel);
                    } else {
                        window.deepBassFilter.gain.value = 0;
                        console.log('Bass boost disabled');
                    }
                } catch (error) {
                    console.error('Error in applyBassBoost:', error);
                }
            },
            args: [enabled, bassLevel]
        });
    }

    chrome.storage.local.get([storageKey], (result) => {
        const state = result[storageKey] || { enabled: false, bass: '0' };
        bassSlider.value = state.bass;
        setToggleState(state.enabled);
        applyBassBoost(tabId, state.enabled, parseFloat(state.bass));
    });

    toggle.addEventListener('click', () => {
        const newState = !isEnabled();
        setToggleState(newState);
        saveState(newState, bassSlider.value);
    });

    bassSlider.addEventListener('input', () => {
        if (isEnabled()) {
            saveState(true, bassSlider.value);
        }
    });

    resetButton.addEventListener('click', () => {
        bassSlider.value = 0;
        saveState(isEnabled(), 0);
    });
}
