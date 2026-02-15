let currentRGB = { r: 0, g: 0, b: 0 };
let targetRGB = { r: 0, g: 0, b: 0 };
let interval;

// === SISTEM SKOR & LEVEL ===
let score = 0;
let combo = 0;
let highScore = parseInt(localStorage.getItem('alchemistHighScore')) || 0;
let currentLevel = 'medium';
let hintUsed = 0; // Track berapa hint sudah dipakai (max 3)
let hintRevealed = { r: false, g: false, b: false }; // Track komponen yang sudah di-reveal

// === STATISTIK ===
let stats = {
    success: parseInt(localStorage.getItem('alchemistStatsSuccess')) || 0,
    fail: parseInt(localStorage.getItem('alchemistStatsFail')) || 0,
    total: parseInt(localStorage.getItem('alchemistStatsTotal')) || 0,
    maxCombo: parseInt(localStorage.getItem('alchemistMaxCombo')) || 0,
    perfectCount: parseInt(localStorage.getItem('alchemistPerfectCount')) || 0
};

// === ACHIEVEMENT SYSTEM ===
const achievements = [
    { id: 'first_potion', name: 'Pemula', desc: 'Selesaikan ramuan pertama', icon: '🧪', condition: () => stats.success >= 1 },
    { id: 'ten_potions', name: 'Apprentice', desc: 'Selesaikan 10 ramuan', icon: '⚗️', condition: () => stats.success >= 10 },
    { id: 'fifty_potions', name: 'Journeyman', desc: 'Selesaikan 50 ramuan', icon: '🔮', condition: () => stats.success >= 50 },
    { id: 'hundred_potions', name: 'Master Alchemist', desc: 'Selesaikan 100 ramuan', icon: '👑', condition: () => stats.success >= 100 },
    { id: 'combo_3', name: 'Combo Starter', desc: 'Raih 3 combo berturut-turut', icon: '🔥', condition: () => stats.maxCombo >= 3 },
    { id: 'combo_5', name: 'Combo Master', desc: 'Raih 5 combo berturut-turut', icon: '💥', condition: () => stats.maxCombo >= 5 },
    { id: 'combo_10', name: 'Unstoppable', desc: 'Raih 10 combo berturut-turut', icon: '⚡', condition: () => stats.maxCombo >= 10 },
    { id: 'score_500', name: 'Skor Tinggi', desc: 'Raih 500 skor total', icon: '⭐', condition: () => highScore >= 500 },
    { id: 'score_1000', name: 'Skor Elite', desc: 'Raih 1000 skor total', icon: '🌟', condition: () => highScore >= 1000 },
    { id: 'score_2000', name: 'Legendary', desc: 'Raih 2000 skor total', icon: '✨', condition: () => highScore >= 2000 },
    { id: 'perfect_1', name: 'Perfeksionis', desc: 'Raih akurasi 95%+', icon: '💎', condition: () => stats.perfectCount >= 1 },
    { id: 'perfect_10', name: 'Precision Master', desc: 'Raih 10x akurasi 95%+', icon: '💠', condition: () => stats.perfectCount >= 10 },
];

let unlockedAchievements = JSON.parse(localStorage.getItem('alchemistAchievements')) || [];

// === RANDOM CUSTOMER REQUESTS ===
const customerRequests = [
    "\"Buatkan aku ramuan ini!\"",
    "\"Aku butuh warna ini, cepat!\"",
    "\"Bisakah kau membuat ini?\"",
    "\"Ramuan ajaib, tolong!\"",
    "\"Ini pesananku, jangan salah!\"",
    "\"Warna ini langka, hati-hati!\"",
    "\"Cepat! Aku sedang terburu-buru!\"",
    "\"Ramuan ini untuk ritual penting...\"",
    "\"Campurkan dengan tepat, ya!\"",
    "\"Aku dengar kau ahli mixing?\""
];

const levelSettings = {
    easy: {
        timerDuration: 25,    // 25 detik
        colorRange: 128,      // Warna lebih sederhana (0-127 atau 128-255)
        bonusMultiplier: 1
    },
    medium: {
        timerDuration: 18,    // 18 detik
        colorRange: 256,      // Full range
        bonusMultiplier: 1.5
    },
    hard: {
        timerDuration: 12,    // 12 detik
        colorRange: 256,
        bonusMultiplier: 2
    }
};

// Inisialisasi Target Warna
function initGame() {
    const settings = levelSettings[currentLevel];
    
    if (currentLevel === 'easy') {
        // Easy: warna lebih sederhana (salah satu komponen dominan)
        const dominant = Math.floor(Math.random() * 3);
        targetRGB = { r: 0, g: 0, b: 0 };
        const keys = ['r', 'g', 'b'];
        targetRGB[keys[dominant]] = 128 + Math.floor(Math.random() * 128);
        // Komponen lain rendah
        keys.filter((_, i) => i !== dominant).forEach(k => {
            targetRGB[k] = Math.floor(Math.random() * 80);
        });
    } else {
        // Medium & Hard: full random
        targetRGB = {
            r: Math.floor(Math.random() * settings.colorRange),
            g: Math.floor(Math.random() * settings.colorRange),
            b: Math.floor(Math.random() * settings.colorRange)
        };
    }
    
    document.getElementById('target-box').style.backgroundColor = 
        `rgb(${targetRGB.r}, ${targetRGB.g}, ${targetRGB.b})`;
    
    // Reset hint untuk orderan baru
    hintUsed = 0;
    hintRevealed = { r: false, g: false, b: false };
    document.getElementById('btn-hint').disabled = false;
    document.getElementById('btn-hint').innerText = '💡 Hint (3x)';
    document.getElementById('target-r').innerText = '?';
    document.getElementById('target-g').innerText = '?';
    document.getElementById('target-b').innerText = '?';
    document.getElementById('target-rgb-hint').classList.add('hidden');
    
    // Update level indicator
    const cauldron = document.querySelector('.cauldron');
    cauldron.className = 'cauldron level-' + currentLevel;
}

// Logika Menuang
function startPour(color) {
    if (interval) return; // Mencegah double interval
    if (!hasActiveOrder) return; // Tidak bisa menuang tanpa orderan
    
    // Prevent scroll on mobile
    document.body.classList.add('no-scroll');
    
    interval = setInterval(() => {
        if (currentRGB[color] < 255) {
            currentRGB[color] = Math.min(255, currentRGB[color] + 3); // Clamp ke 255 agar tidak overflow
            updateUI();
            createBubble(); // Tambah bubble saat menuang
        }
    }, 50);
}

function stopPour() {
    clearInterval(interval);
    interval = null;
    
    // Re-enable scroll
    document.body.classList.remove('no-scroll');
}

// Update Tampilan Cairan
function updateUI() {
    const liquid = document.getElementById('liquid');
    liquid.style.backgroundColor = `rgb(${currentRGB.r}, ${currentRGB.g}, ${currentRGB.b})`;
    
    // Hitung volume visual (maks 100%)
    const totalFill = Math.min((currentRGB.r + currentRGB.g + currentRGB.b) / 7.65, 100);
    liquid.style.height = totalFill + "%";
    
    // Update RGB Preview
    document.getElementById('rgb-r').innerText = currentRGB.r;
    document.getElementById('rgb-g').innerText = currentRGB.g;
    document.getElementById('rgb-b').innerText = currentRGB.b;
    
    // Update skor display
    document.getElementById('score').innerText = score;
    document.getElementById('highscore').innerText = highScore;
    
    // Update stats display
    document.getElementById('stat-success').innerText = stats.success;
    document.getElementById('stat-fail').innerText = stats.fail;
    document.getElementById('stat-total').innerText = stats.total;
}

// Cek Akurasi
function checkResult() {
    if (!hasActiveOrder) return; // Tidak bisa submit tanpa orderan
    
    clearInterval(timerInterval); // Stop timer saat submit
    hasActiveOrder = false; // Orderan selesai
    
    const distance = Math.sqrt(
        Math.pow(targetRGB.r - currentRGB.r, 2) +
        Math.pow(targetRGB.g - currentRGB.g, 2) +
        Math.pow(targetRGB.b - currentRGB.b, 2)
    );
    
    const maxDistance = Math.sqrt(Math.pow(255, 2) * 3);
    const accuracy = Math.max(0, 100 - (distance / maxDistance * 100)).toFixed(1);
    
    // Track perfect scores
    if (accuracy >= 95) {
        stats.perfectCount++;
    }
    
    const settings = levelSettings[currentLevel];
    const cauldron = document.querySelector('.cauldron');
    
    // Tampilkan hasil di modal
    const resultTitle = document.getElementById('result-title');
    const resultBonus = document.getElementById('result-bonus');
    const comboDisplay = document.getElementById('combo-display');
    
    if (accuracy >= 70) {
        // BERHASIL
        combo++;
        stats.success++;
        stats.total++;
        
        // Update max combo
        if (combo > stats.maxCombo) {
            stats.maxCombo = combo;
        }
        
        let baseScore = Math.round(accuracy * settings.bonusMultiplier);
        let comboBonus = combo > 1 ? Math.round(baseScore * (combo * 0.1)) : 0;
        let totalGained = baseScore + comboBonus;
        
        score += totalGained;
        highScore = Math.max(0, highScore + totalGained); // Highscore sebagai total akumulatif
        
        resultTitle.innerText = "🎉 Pelanggan Puas!";
        resultBonus.innerText = `+${baseScore} poin`;
        
        if (combo > 1) {
            comboDisplay.innerText = `🔥 Combo x${combo}! Bonus +${comboBonus}`;
        } else {
            comboDisplay.innerText = "";
        }
        
        // Efek visual sukses
        cauldron.classList.add('glow-success');
        createConfetti();
        
    } else {
        // GAGAL
        combo = 0;
        stats.fail++;
        stats.total++;
        
        resultTitle.innerText = "😞 Warna Tidak Sesuai!";
        resultBonus.innerText = "Tidak ada poin";
        comboDisplay.innerText = "Combo reset!";
        
        // Efek visual gagal
        cauldron.classList.add('glow-fail');
        createSmoke();
    }
    
    // Update stats display
    updateUI();
    
    document.getElementById('result-score').innerText = `Akurasi: ${accuracy}%`;
    document.getElementById('result-modal').classList.remove('hidden');
    
    // Update skor display setelah semua perhitungan
    document.getElementById('score').innerText = score;
    
    // Save stats to localStorage
    saveProgress();
    
    // Check achievements
    checkAchievements();
    
    // Hapus glow setelah 1 detik
    setTimeout(() => {
        cauldron.classList.remove('glow-success', 'glow-fail');
    }, 1000);
}

// Tutup modal hasil dan tampilkan waiting state
function closeResultModal() {
    document.getElementById('result-modal').classList.add('hidden');
    showWaitingState();
}

// Tampilkan waiting state (tidak ada orderan)
function showWaitingState() {
    hasActiveOrder = false;
    document.getElementById('waiting-state').classList.remove('hidden');
    document.querySelector('.customer-area').classList.add('hidden');
    document.querySelector('.mission-card').classList.add('hidden');
    
    // Disable tombol kontrol
    setControlsEnabled(false);
}

// Sembunyikan waiting state dan mulai orderan baru
function hideWaitingState() {
    document.getElementById('waiting-state').classList.add('hidden');
    document.querySelector('.customer-area').classList.remove('hidden');
    document.querySelector('.mission-card').classList.remove('hidden');
    
    // Enable tombol kontrol
    setControlsEnabled(true);
}

// Enable/disable tombol kontrol
function setControlsEnabled(enabled) {
    const buttons = document.querySelectorAll('.btn-pour, #btn-submit');
    buttons.forEach(btn => {
        btn.disabled = !enabled;
        btn.style.opacity = enabled ? '1' : '0.5';
    });
}

// Ambil orderan baru
function takeNewOrder() {
    hideWaitingState();
    nextCustomer();
}

// Legacy function untuk kompatibilitas
function playAgain() {
    closeResultModal();
}

let gameActive = true;
let hasActiveOrder = false; // Track apakah ada orderan aktif
let timeLeft = 100;
let timerInterval;
const emojis = ['🧙‍♂️', '🧝‍♀️', '🧛‍♂️', '🧚', '🧟'];

function startCustomerTimer() {
    clearInterval(timerInterval);
    const settings = levelSettings[currentLevel];
    
    // Timer dalam detik, update setiap 100ms
    const totalTime = settings.timerDuration * 1000; // Convert ke milliseconds
    const startTime = Date.now();
    
    timerInterval = setInterval(() => {
        if (!gameActive) return;
        
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalTime - elapsed);
        const percentage = (remaining / totalTime) * 100;
        
        const timerFill = document.getElementById('timer-fill');
        timerFill.style.width = percentage + "%";

        // Berubah warna jadi merah kalau mau habis (< 30%)
        if (percentage < 30) timerFill.style.backgroundColor = "#e94560";
        else timerFill.style.backgroundColor = "#2ecc71";

        if (remaining <= 0) {
            clearInterval(timerInterval);
            customerLeaves();
        }
    }, 100);
}

function customerLeaves() {
    hasActiveOrder = false; // Orderan selesai (gagal)
    combo = 0; // Reset combo
    stats.fail++;
    stats.total++;
    score = Math.max(0, score - 10); // Kurangi skor, minimal 0
    highScore = Math.max(0, highScore - 10); // Sinkron dengan penalti agar akumulasi tetap konsisten
    updateUI();
    
    // Tampilkan notifikasi
    const resultTitle = document.getElementById('result-title');
    const resultBonus = document.getElementById('result-bonus');
    const comboDisplay = document.getElementById('combo-display');
    
    resultTitle.innerText = "⏰ Waktu Habis!";
    document.getElementById('result-score').innerText = "Pelanggan pergi!";
    resultBonus.innerText = "-10 poin";
    comboDisplay.innerText = "Combo reset!";
    
    createSmoke();
    document.getElementById('result-modal').classList.remove('hidden');

    // Persist dan cek achievement setelah kegagalan/timeout
    saveProgress();
    checkAchievements();
}

function nextCustomer() {
    hasActiveOrder = true; // Ada orderan aktif
    
    // Ganti Emoji
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    document.getElementById('customer-emoji').innerText = randomEmoji;
    
    // Ganti Request text
    const randomRequest = customerRequests[Math.floor(Math.random() * customerRequests.length)];
    document.getElementById('customer-request').innerText = randomRequest;
    
    // Reset Gelas & Target Warna Baru
    currentRGB = { r: 0, g: 0, b: 0 };
    
    // Clear bubbles
    document.getElementById('bubbles-container').innerHTML = '';
    
    updateUI();
    initGame();
    startCustomerTimer();
}

// === EFEK VISUAL ===

// Bubble saat menuang
function createBubble() {
    const container = document.getElementById('bubbles-container');
    if (!container) return;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const size = Math.random() * 8 + 4;
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left = Math.random() * 100 + '%';
    bubble.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
    
    container.appendChild(bubble);
    
    // Hapus bubble setelah animasi selesai
    setTimeout(() => bubble.remove(), 1000);
}

// Confetti saat berhasil
function createConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e94560'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            container.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

// Smoke/asap saat gagal
function createSmoke() {
    const cauldron = document.querySelector('.cauldron');
    const rect = cauldron.getBoundingClientRect();
    
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const smoke = document.createElement('div');
            smoke.className = 'smoke';
            smoke.style.position = 'fixed';
            smoke.style.left = (rect.left + Math.random() * rect.width) + 'px';
            smoke.style.top = rect.top + 'px';
            
            document.body.appendChild(smoke);
            
            setTimeout(() => smoke.remove(), 1500);
        }, i * 100);
    }
}


// Event Listeners
document.getElementById('btn-r').onmousedown = () => startPour('r');
document.getElementById('btn-g').onmousedown = () => startPour('g');
document.getElementById('btn-b').onmousedown = () => startPour('b');

// Support untuk Touch Device (HP)
document.getElementById('btn-r').ontouchstart = () => startPour('r');
document.getElementById('btn-g').ontouchstart = () => startPour('g');
document.getElementById('btn-b').ontouchstart = () => startPour('b');

window.onmouseup = stopPour;
window.ontouchend = stopPour;

document.getElementById('btn-submit').onclick = checkResult;
document.getElementById('btn-reset').onclick = () => {
    if (!hasActiveOrder) return;
    currentRGB = { r: 0, g: 0, b: 0 };
    document.getElementById('bubbles-container').innerHTML = '';
    updateUI();
};

// Tombol ambil orderan baru
document.getElementById('btn-next-customer').onclick = takeNewOrder;

// Level change listener
document.getElementById('level-select').onchange = (e) => {
    currentLevel = e.target.value;
    // Hanya update jika ada orderan aktif, kalau tidak cukup simpan saja
    if (hasActiveOrder) {
        combo = 0;
        nextCustomer();
    }
};

// Hint button listener
document.getElementById('btn-hint').onclick = () => {
    if (hintUsed >= 3 || !hasActiveOrder) return;
    
    // Cari komponen yang belum di-reveal
    const unrevealed = Object.keys(hintRevealed).filter(k => !hintRevealed[k]);
    if (unrevealed.length === 0) return;
    
    // Tampilkan container hint saat pertama kali dipakai
    const hintContainer = document.getElementById('target-rgb-hint');
    if (hintContainer.classList.contains('hidden')) {
        hintContainer.classList.remove('hidden');
    }
    
    // Pilih random dari yang belum di-reveal
    const randomKey = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    hintRevealed[randomKey] = true;
    hintUsed++;
    
    // Update tampilan
    const colorNames = { r: 'target-r', g: 'target-g', b: 'target-b' };
    document.getElementById(colorNames[randomKey]).innerText = targetRGB[randomKey];
    
    // Update button text
    const remaining = 3 - hintUsed;
    if (remaining > 0) {
        document.getElementById('btn-hint').innerText = `💡 Hint (${remaining}x)`;
    } else {
        document.getElementById('btn-hint').disabled = true;
        document.getElementById('btn-hint').innerText = '💡 Habis';
    }
};

// Achievement button listener
document.getElementById('btn-achievements').onclick = showAchievementModal;

// === TUTORIAL SYSTEM ===
function showTutorial() {
    const dontShow = localStorage.getItem('alchemistHideTutorial');
    if (dontShow === 'true') {
        return; // Jangan tampilkan jika user sudah memilih
    }
    document.getElementById('tutorial-modal').classList.remove('hidden');
}

function closeTutorial() {
    // Cek apakah user centang "jangan tampilkan lagi"
    const dontShowCheckbox = document.getElementById('dont-show-tutorial');
    if (dontShowCheckbox.checked) {
        localStorage.setItem('alchemistHideTutorial', 'true');
    }
    document.getElementById('tutorial-modal').classList.add('hidden');
}

// === ACHIEVEMENT SYSTEM ===
function checkAchievements() {
    achievements.forEach(achievement => {
        if (!unlockedAchievements.includes(achievement.id) && achievement.condition()) {
            unlockAchievement(achievement);
        }
    });
}

function unlockAchievement(achievement) {
    unlockedAchievements.push(achievement.id);
    localStorage.setItem('alchemistAchievements', JSON.stringify(unlockedAchievements));
    
    // Show popup
    showAchievementPopup(achievement);
}

function showAchievementPopup(achievement) {
    const popup = document.getElementById('achievement-popup');
    document.getElementById('popup-achievement-name').innerText = `${achievement.icon} ${achievement.name}`;
    
    popup.classList.remove('hidden');
    popup.classList.add('show');
    
    // Hide after animation
    setTimeout(() => {
        popup.classList.remove('show');
        popup.classList.add('hidden');
    }, 3000);
}

function showAchievementModal() {
    const list = document.getElementById('achievement-list');
    list.innerHTML = '';
    
    achievements.forEach(achievement => {
        const isUnlocked = unlockedAchievements.includes(achievement.id);
        const item = document.createElement('div');
        item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        item.innerHTML = `
            <span class="achievement-icon">${achievement.icon}</span>
            <div class="achievement-info">
                <h4>${achievement.name}</h4>
                <p>${achievement.desc}</p>
            </div>
        `;
        
        list.appendChild(item);
    });
    
    document.getElementById('achievement-modal').classList.remove('hidden');
}

function closeAchievementModal() {
    document.getElementById('achievement-modal').classList.add('hidden');
}

// === SAVE/LOAD PROGRESS ===
function saveProgress() {
    localStorage.setItem('alchemistHighScore', highScore);
    localStorage.setItem('alchemistStatsSuccess', stats.success);
    localStorage.setItem('alchemistStatsFail', stats.fail);
    localStorage.setItem('alchemistStatsTotal', stats.total);
    localStorage.setItem('alchemistMaxCombo', stats.maxCombo);
    localStorage.setItem('alchemistPerfectCount', stats.perfectCount);
}

// === MOBILE TOUCH IMPROVEMENTS ===
// Prevent default touch behavior on pour buttons
['btn-r', 'btn-g', 'btn-b'].forEach(id => {
    const btn = document.getElementById(id);
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.classList.add('touching');
    }, { passive: false });
    
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('touching');
    }, { passive: false });
});

// Jalankan saat pertama kali load
updateUI(); // Tampilkan skor awal
showWaitingState(); // Mulai dengan waiting state
showTutorial(); // Tampilkan tutorial untuk pemain baru