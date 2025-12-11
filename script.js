const startBtn = document.getElementById('start-test');
const progressCard = document.getElementById('progress-card');
const heroTitle = document.getElementById('hero-title');
const heroSubtitle = document.getElementById('hero-subtitle');
const heroActions = document.getElementById('hero-actions');
const heroBullets = document.getElementById('hero-bullets');
const progressSteps = Array.from(document.querySelectorAll('#progress-steps .step'));
const resultsSection = document.getElementById('results');
const overallScore = document.getElementById('overall-score');
const downloadValue = document.getElementById('download-value');
const uploadValue = document.getElementById('upload-value');
const pingValue = document.getElementById('ping-value');
const jitterValue = document.getElementById('jitter-value');
const yt1080 = document.getElementById('yt-1080');
const yt4k = document.getElementById('yt-4k');
const cinema = document.getElementById('cinema');
const call11 = document.getElementById('call-1-1');
const callSmall = document.getElementById('call-small');
const callLarge = document.getElementById('call-large');
const heavyWork = document.getElementById('heavy-work');
const recommendationsList = document.getElementById('recommendations');
const repeatBtn = document.getElementById('repeat-test');
const savePdfBtn = document.getElementById('save-pdf');

const DOWNLOAD_RUNS = 4;
const UPLOAD_RUNS = 3;
const PING_RUNS = 12;
const DOWNLOAD_SIZE_MB = 1.5; // aligned with backend
const UPLOAD_SIZE_MB = 1.2;

function setStepActive(index) {
  progressSteps.forEach((step, idx) => {
    step.classList.toggle('active', idx === index);
  });
}

function showTestingState() {
  heroTitle.textContent = 'Идёт тест качества интернета…';
  heroSubtitle.textContent = 'Пожалуйста, не обновляйте страницу и по возможности не нагружайте сеть во время проверки.';
  heroActions.hidden = true;
  heroBullets.hidden = true;
  progressCard.hidden = false;
  startBtn.disabled = true;
  resultsSection.hidden = true;
}

function showDefaultState() {
  heroTitle.textContent = 'Проверка интернета для видео и видеосвязи';
  heroSubtitle.innerHTML = 'Узнайте, как ваше подключение справляется с YouTube, онлайн-кинотеатрами и видеозвонками.<br>Объективный тест качества интернета на реальных сценариях — без регистрации и лишних данных.';
  heroActions.hidden = false;
  heroBullets.hidden = false;
  progressCard.hidden = true;
  startBtn.disabled = false;
}

async function measureDownload() {
  const speeds = [];
  for (let i = 0; i < DOWNLOAD_RUNS; i += 1) {
    setStepActive(0);
    const start = performance.now();
    const response = await fetch('/api/download-test', { cache: 'no-store' });
    const buffer = await response.arrayBuffer();
    const durationMs = performance.now() - start;
    const bits = buffer.byteLength * 8;
    const mbps = (bits / durationMs) / 1000;
    speeds.push(mbps);
  }
  return average(speeds);
}

async function measureUpload() {
  const speeds = [];
  const payload = new Uint8Array(Math.floor(UPLOAD_SIZE_MB * 1024 * 1024)).fill(111);
  for (let i = 0; i < UPLOAD_RUNS; i += 1) {
    setStepActive(1);
    const start = performance.now();
    await fetch('/api/upload-test', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: payload
    });
    const durationMs = performance.now() - start;
    const bits = payload.byteLength * 8;
    const mbps = (bits / durationMs) / 1000;
    speeds.push(mbps);
  }
  return average(speeds);
}

async function measurePing() {
  const times = [];
  for (let i = 0; i < PING_RUNS; i += 1) {
    setStepActive(2);
    const start = performance.now();
    await fetch('/api/ping', { cache: 'no-store' });
    const duration = performance.now() - start;
    times.push(duration);
  }
  const avg = average(times);
  const jitter = calculateJitter(times, avg);
  return { avg, jitter };
}

function calculateJitter(values, mean) {
  if (!values.length) return 0;
  const variance = values.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function computeScore(download, upload, ping, jitter) {
  const normDownload = Math.min(download / 50, 1);
  const normUpload = Math.min(upload / 20, 1);
  const pingScore = Math.min(Math.max((150 - ping) / 150, 0), 1);
  const jitterScore = Math.min(Math.max((60 - jitter) / 60, 0), 1);
  const score = (normDownload * 0.35 + normUpload * 0.25 + pingScore * 0.2 + jitterScore * 0.2) * 10;
  return Math.max(0, Math.min(10, score));
}

function updateVideoTexts(download) {
  yt1080.textContent = download >= 8
    ? 'Комфортно. Видео воспроизводится без подзагрузок на одном устройстве.'
    : 'На грани. Возможно стабильное воспроизведение, но при дополнительной нагрузке в сети могут быть подзагрузки.';

  yt4k.textContent = download >= 25
    ? 'В целом возможно. При умеренной нагрузке в сети 4K-видео будет воспроизводиться стабильно.'
    : 'Рекомендуется снизить качество до 1080p. Для стабильного 4K-видео текущей скорости недостаточно.';

  cinema.textContent = download >= 20
    ? 'Возможно комфортное воспроизведение нескольких потоков HD/Full HD видео одновременно.'
    : 'Оптимально до 2 одновременных потоков в 1080p. При 3 и более устройствах, смотрящих видео в HD, возможны паузы и буферизация.';
}

function updateCallTexts(upload, ping, jitter) {
  call11.textContent = upload >= 2 && ping < 80 && jitter < 25
    ? 'Качество подключения подходит для регулярных видеозвонков с включённой камерой.'
    : 'Возможны эпизодические задержки звука или изображения. При возможности используйте проводное подключение.';

  callSmall.textContent = upload >= 3 && ping < 90
    ? 'В целом комфортно. При высокой загрузке сети другими устройствами возможны кратковременные задержки звука или изображения.'
    : 'Возможны эпизодические задержки. Старайтесь уменьшить параллельную нагрузку на сеть во время совещаний.';

  callLarge.textContent = upload >= 5 && ping < 70 && jitter < 20
    ? 'В целом возможно. Следите за нагрузкой сети и используйте проводное подключение для большей стабильности.'
    : 'Возможны эпизодические зависания. Для стабильной работы рекомендуется дополнительный запас по скорости и стабильности соединения.';
}

function updateWorkTexts(upload) {
  heavyWork.textContent = upload >= 8
    ? 'Скорость отдачи позволяет быстрее загружать крупные файлы, резервные копии и видео в облако.'
    : 'Скорость отдачи ограничена. Загрузка больших архивов, видео и резервных копий может занимать заметное время, особенно при одновременной работе нескольких устройств.';
}

function updateRecommendations(download, upload, ping, jitter) {
  const recs = [
    'Если вы часто смотрите видео в 4K на телевизоре или мониторе с высоким разрешением, рассмотрите возможность снизить качество воспроизведения до 1080p или обсудить с провайдером переход на более высокий тариф.',
    'Во время важных видеозвонков желательно по возможности отключать загрузки и онлайн-видео на других устройствах, а также не запускать торренты и крупные обновления.',
    'Если вы замечаете сильные провалы скорости или стабильности в определённое время суток, имеет смысл выполнить несколько тестов в разное время и при необходимости приложить отчёты к обращению в поддержку провайдера.'
  ];

  if (download < 10) {
    recs.push('Для стабильного просмотра видео в 1080p может потребоваться повышение скорости загрузки или ограничение нагрузки других устройств.');
  }
  if (upload < 3) {
    recs.push('Для групповых видеозвонков желательно увеличить скорость отдачи или использовать подключение по кабелю.');
  }
  if (ping > 80 || jitter > 25) {
    recs.push('Высокая задержка или джиттер могут быть связаны с Wi‑Fi. Попробуйте переместиться ближе к роутеру или переключиться на проводное соединение.');
  }

  recommendationsList.innerHTML = recs.map(item => `<li>${item}</li>`).join('');
}

function updateResults(download, upload, ping, jitter, score) {
  overallScore.textContent = `Общая оценка качества интернета: ${score.toFixed(1)} из 10`;
  downloadValue.textContent = `${download.toFixed(1)} Мбит/с`;
  uploadValue.textContent = `${upload.toFixed(1)} Мбит/с`;
  pingValue.textContent = `${ping.toFixed(0)} мс`;
  jitterValue.textContent = `${jitter.toFixed(0)} мс`;

  updateVideoTexts(download);
  updateCallTexts(upload, ping, jitter);
  updateWorkTexts(upload);
  updateRecommendations(download, upload, ping, jitter);
}

async function runTest() {
  showTestingState();
  try {
    const download = await measureDownload();
    const upload = await measureUpload();
    const { avg: ping, jitter } = await measurePing();

    setStepActive(3);
    setStepActive(4);

    const score = computeScore(download, upload, ping, jitter);
    updateResults(download, upload, ping, jitter, score);

    resultsSection.hidden = false;
    progressCard.hidden = true;
  } catch (error) {
    console.error('Ошибка теста', error);
    alert('Не удалось выполнить тест. Проверьте соединение и повторите попытку.');
    showDefaultState();
  } finally {
    startBtn.disabled = false;
  }
}

startBtn?.addEventListener('click', runTest);
repeatBtn?.addEventListener('click', () => {
  resultsSection.hidden = true;
  showDefaultState();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

savePdfBtn?.addEventListener('click', () => window.print());
