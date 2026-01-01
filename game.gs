// ============================================
// ЦВЕТОВОЙ РЕАКТОР - Основная игровая логика
// ============================================

// Конфигурация игры
const CONFIG = {
    TOTAL_TIME: 60, // секунд
    BASE_SPAWN_RATE: 1500, // мс между появлением кругов
    MIN_SPAWN_RATE: 300, // минимальная скорость
    LEVEL_UP_SCORE: 100, // очков для повышения уровня
    COLORS: {
        'КРАСНЫЙ': '#ff4757',
        'СИНИЙ': '#3742fa',
        'ЗЕЛЕНЫЙ': '#2ed573',
        'ЖЕЛТЫЙ': '#ffd32a'
    },
    COLOR_NAMES: ['КРАСНЫЙ', 'СИНИЙ', 'ЗЕЛЕНЫЙ', 'ЖЕЛТЫЙ']
};

// Состояние игры
const gameState = {
    score: 0,
    level: 1,
    timeLeft: CONFIG.TOTAL_TIME,
    isPlaying: false,
    isPaused: false,
    currentColor: 'КРАСНЫЙ',
    circles: [],
    timerId: null,
    spawnTimerId: null,
    record: 0,
    soundEnabled: true,
    spawnRate: CONFIG.BASE_SPAWN_RATE
};

// DOM элементы
const elements = {
    score: document.getElementById('score'),
    level: document.getElementById('level'),
    timer: document.getElementById('timer'),
    colorText: document.getElementById('colorText'),
    colorTarget: document.getElementById('colorTarget'),
    gameField: document.getElementById('gameField'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    playBtn: document.getElementById('playBtn'),
    recordEl: document.getElementById('record'),
    soundToggle: document.getElementById('soundToggle'),
    welcomeScreen: document.getElementById('welcomeScreen')
};

// Инициализация игры
function initGame() {
    loadRecord();
    updateUI();
    setupEventListeners();
}

// Загрузка рекорда из localStorage
function loadRecord() {
    const savedRecord = localStorage.getItem('colorReactorRecord');
    if (savedRecord) {
        gameState.record = parseInt(savedRecord);
        elements.recordEl.textContent = gameState.record;
    }
}

// Сохранение рекорда
function saveRecord() {
    if (gameState.score > gameState.record) {
        gameState.record = gameState.score;
        localStorage.setItem('colorReactorRecord', gameState.record.toString());
        elements.recordEl.textContent = gameState.record;
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    elements.startBtn.addEventListener('click', startGame);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.resetBtn.addEventListener('click', resetGame);
    elements.playBtn.addEventListener('click', startGame);
    elements.soundToggle.addEventListener('change', toggleSound);
    
    // Обработка кликов по игровому полю
    elements.gameField.addEventListener('click', handleCircleClick);
}

// Начало игры
function startGame() {
    if (gameState.isPlaying) return;
    
    // Скрываем экран приветствия
    elements.welcomeScreen.style.opacity = '0';
    setTimeout(() => {
        elements.welcomeScreen.style.display = 'none';
    }, 500);
    
    // Сброс состояния
    resetGameState();
    gameState.isPlaying = true;
    gameState.isPaused = false;
    
    // Обновляем UI
    updateButtons();
    
    // Стартуем таймеры
    startGameTimer();
    startSpawningCircles();
    
    // Устанавливаем первый цвет
    setNewTargetColor();
}

// Сброс состояния игры
function resetGameState() {
    gameState.score = 0;
    gameState.level = 1;
    gameState.timeLeft = CONFIG.TOTAL_TIME;
    gameState.spawnRate = CONFIG.BASE_SPAWN_RATE;
    gameState.circles = [];
    
    // Очищаем игровое поле
    elements.gameField.innerHTML = '';
    
    updateUI();
}

// Пауза/продолжение
function togglePause() {
    if (!gameState.isPlaying) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        clearInterval(gameState.timerId);
        clearInterval(gameState.spawnTimerId);
    } else {
        startGameTimer();
        startSpawningCircles();
    }
    
    updateButtons();
}

// Сброс игры
function resetGame() {
    if (gameState.isPlaying) {
        clearInterval(gameState.timerId);
        clearInterval(gameState.spawnTimerId);
        gameState.isPlaying = false;
    }
    
    resetGameState();
    updateButtons();
    
    // Показываем экран приветствия
    elements.welcomeScreen.style.display = 'flex';
    setTimeout(() => {
        elements.welcomeScreen.style.opacity = '1';
    }, 50);
}

// Включение/выключение звука
function toggleSound() {
    gameState.soundEnabled = elements.soundToggle.checked;
}

// Обновление кнопок управления
function updateButtons() {
    elements.startBtn.disabled = gameState.isPlaying;
    elements.pauseBtn.disabled = !gameState.isPlaying;
    elements.pauseBtn.textContent = gameState.isPaused ? 'ПРОДОЛЖИТЬ' : 'ПАУЗА';
}

// Таймер игры
function startGameTimer() {
    clearInterval(gameState.timerId);
    
    gameState.timerId = setInterval(() => {
        if (!gameState.isPaused) {
            gameState.timeLeft--;
            elements.timer.textContent = gameState.timeLeft;
            
            // Конец игры
            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);
}

// Генерация кругов
function startSpawningCircles() {
    clearInterval(gameState.spawnTimerId);
    
    gameState.spawnTimerId = setInterval(() => {
        if (!gameState.isPaused && gameState.isPlaying) {
            spawnCircle();
        }
    }, gameState.spawnRate);
}

// Создание одного круга
function spawnCircle() {
    const circle = document.createElement('div');
    circle.className = 'color-circle';
    
    // Случайный цвет
    const colorName = CONFIG.COLOR_NAMES[Math.floor(Math.random() * CONFIG.COLOR_NAMES.length)];
    const colorHex = CONFIG.COLORS[colorName];
    
    // Случайная позиция (с отступами от краев)
    const size = 60 + Math.random() * 40; // 60-100px
    const maxX = elements.gameField.clientWidth - size;
    const maxY = elements.gameField.clientHeight - size;
    
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);
    
    // Устанавливаем стили
    circle.style.width = `${size}px`;
    circle.style.height = `${size}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.style.backgroundColor = colorHex;
    circle.style.border = `3px solid ${lightenColor(colorHex, 30)}`;
    
    // Сохраняем данные в объекте
    circle.dataset.color = colorName;
    circle.dataset.colorHex = colorHex;
    
    // Анимация появления
    circle.style.transform = 'scale(0)';
    circle.style.opacity = '0';
    
    elements.gameField.appendChild(circle);
    
    // Запускаем анимацию
    requestAnimationFrame(() => {
        circle.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        circle.style.transform = 'scale(1)';
        circle.style.opacity = '1';
    });
    
    // Автоматическое удаление через 3 секунды
    setTimeout(() => {
        if (circle.parentNode) {
            circle.style.opacity = '0';
            circle.style.transform = 'scale(0.5)';
            setTimeout(() => {
                if (circle.parentNode) {
                    circle.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Обработка клика по кругу
function handleCircleClick(event) {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    const circle = event.target;
    if (!circle.classList.contains('color-circle')) return;
    
    const circleColor = circle.dataset.color;
    const circleColorHex = circle.dataset.colorHex;
    
    // Проверяем, правильный ли цвет
    if (circleColor === gameState.currentColor) {
        // Правильный клик
        handleCorrectClick(circle, circleColorHex);
    } else {
        // Неправильный клик
        handleWrongClick(circle);
    }
}

// Правильный клик
function handleCorrectClick(circle, colorHex) {
    // Увеличиваем счет
    gameState.score += 10;
    
    // Проверяем уровень
    const newLevel = Math.floor(gameState.score / CONFIG.LEVEL_UP_SCORE) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        // Увеличиваем скорость
        gameState.spawnRate = Math.max(
            CONFIG.MIN_SPAWN_RATE,
            CONFIG.BASE_SPAWN_RATE - (gameState.level - 1) * 200
        );
        startSpawningCircles(); // Перезапускаем с новой скоростью
    }
    
    // Эффект взрыва
    createExplosion(circle, colorHex);
    
    // Удаляем круг
    circle.remove();
    
    // Устанавливаем новый целевой цвет
    setNewTargetColor();
    
    // Обновляем UI
    updateUI();
    
    // Проигрываем звук (если включен)
    if (gameState.soundEnabled) {
        playSound('correct');
    }
}

// Неправильный клик
function handleWrongClick(circle) {
    // Штраф
    gameState.score = Math.max(0, gameState.score - 5);
    
    // Эффект ошибки
    circle.style.border = '3px solid #ff0000';
    circle.style.boxShadow = '0 0 30px #ff0000';
    
    // Эффект вибрации (если поддерживается)
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
    
    // Эффект красного мерцания
    document.body.style.backgroundColor = '#ff0000';
    setTimeout(() => {
        document.body.style.backgroundColor = '';
    }, 100);
    
    // Обновляем UI
    updateUI();
    
    // Проигрываем звук (если включен)
    if (gameState.soundEnabled) {
        playSound('wrong');
    }
    
    // Восстанавливаем цвет круга
    setTimeout(() => {
        circle.style.border = `3px solid ${lightenColor(circle.dataset.colorHex, 30)}`;
        circle.style.boxShadow = '0 0 20px currentColor';
    }, 200);
}

// Создание эффекта взрыва
function createExplosion(circle, colorHex) {
    const rect = circle.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Создаем частицы
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.backgroundColor = colorHex;
        particle.style.borderRadius = '50%';
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        
        document.body.appendChild(particle);
        
        // Анимация частицы
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        const duration = 500 + Math.random() * 500;
        
        particle.animate([
            {
                transform: `translate(0, 0) scale(1)`,
                opacity: 1
            },
            {
                transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.2, 0, 0.8, 1)'
        });
        
        // Удаляем частицу после анимации
        setTimeout(() => {
            particle.remove();
        }, duration);
    }
}

// Установка нового целевого цвета
function setNewTargetColor() {
    // Выбираем случайный цвет, отличный от текущего
    let newColor;
    do {
        newColor = CONFIG.COLOR_NAMES[Math.floor(Math.random() * CONFIG.COLOR_NAMES.length)];
    } while (newColor === gameState.currentColor && CONFIG.COLOR_NAMES.length > 1);
    
    gameState.currentColor = newColor;
    elements.colorText.textContent = newColor;
    elements.colorTarget.style.color = CONFIG.COLORS[newColor];
    elements.colorTarget.style.boxShadow = `0 0 40px ${CONFIG.COLORS[newColor]}`;
}

// Обновление интерфейса
function updateUI() {
    elements.score.textContent = gameState.score;
    elements.level.textContent = gameState.level;
    elements.timer.textContent = gameState.timeLeft;
}

// Конец игры
function endGame() {
    clearInterval(gameState.timerId);
    clearInterval(gameState.spawnTimerId);
    gameState.isPlaying = false;
    
    // Сохраняем рекорд
    saveRecord();
    
    // Показываем результат
    alert(`Игра окончена!\nВаш счет: ${gameState.score}\nРекорд: ${gameState.record}`);
    
    // Возвращаем на экран приветствия
    elements.welcomeScreen.style.display = 'flex';
    setTimeout(() => {
        elements.welcomeScreen.style.opacity = '1';
    }, 50);
}

// Воспроизведение звуков
function playSound(type) {
    if (!gameState.soundEnabled) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Настраиваем звук в зависимости от типа
    switch (type) {
        case 'correct':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.type = 'sine';
            break;
        case 'wrong':
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.type = 'square';
            break;
    }
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Вспомогательная функция: осветление цвета
function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}

// Запуск игры при загрузке страницы
document.addEventListener('DOMContentLoaded', initGame);
// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker зарегистрирован:', registration);
            })
            .catch(error => {
                console.log('Ошибка регистрации Service Worker:', error);
            });
    });
}
