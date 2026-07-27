export async function playAlertTone(frequency = 880, duration = 180) {
  if (typeof window === 'undefined') {
    return;
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.08;

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();

  window.setTimeout(() => {
    oscillator.stop();
    context.close();
  }, duration);
}
