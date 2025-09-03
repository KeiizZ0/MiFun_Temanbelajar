// GANTI DENGAN API KEY ANDA
const API_KEY = "AIzaSyAhQ_VIw3-L1UUXxIo933FyaNu1c5IxpRg";
// URL API yang diperbaiki untuk Gemini 1.5 Flash
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// === ELEMEN DOM ===
const landingPage = document.getElementById('landing-page');
const quizPage = document.getElementById('quiz-page');
const resultsPage = document.getElementById('results-page');
const setupModal = document.getElementById('setup-modal');
const loader = document.getElementById('loader');

const startBtn = document.getElementById('start-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const quizSetupForm = document.getElementById('quiz-setup-form');
const backToHomeBtn = document.getElementById('back-to-home-btn');

const questionNumberEl = document.getElementById('question-number');
const totalQuestionsEl = document.getElementById('total-questions');
const scoreDisplayEl = document.getElementById('score-display');
const questionTextEl = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const hintTextEl = document.getElementById('hint-text');
const clueContainer = document.getElementById('clue-container');
const addClueBtn = document.getElementById('add-clue-btn');
const nextQuestionBtn = document.getElementById('next-question-btn');

const finalScoreEl = document.getElementById('final-score');
const analysisTextEl = document.getElementById('analysis-text');

// === STATE APLIKASI ===
let questions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let score = 0;
let cluesUsed = 0;
let loaderInterval = null;
let currentLoaderImage = 0; // 0: Michelemembuatsoal.png, 1: michellesenyum.png

// === INFO LOG STATE ===
let currentUsers = 1;
let workingOnQuiz = 0;

/**
* Update the info log display
*/
function updateInfoLog() {
    const usersCountEl = document.getElementById('users-count');
    const workingCountEl = document.getElementById('working-count');
    usersCountEl.textContent = currentUsers;
    workingCountEl.textContent = workingOnQuiz;

    // Persist working on quiz state in localStorage
    const sessionId = sessionStorage.getItem('sessionId');
    if (sessionId) {
        localStorage.setItem(`user_${sessionId}_workingOnQuiz`, workingOnQuiz);
    }
}

/**
* Initialize info log on page load
* Note: This is a client-side simulation. For real-time cross-device tracking,
* a backend server or real-time service (e.g., Firebase, WebSocket) is required.
*/
function initializeInfoLog() {
    const sessionId = sessionStorage.getItem('sessionId') || generateSessionId();
    const lastActivity = localStorage.getItem(`user_${sessionId}_lastActivity`);
    const now = Date.now();

    // Check if this is a new session or if the user was inactive for too long (e.g., 30 minutes)
    if (!lastActivity || (now - parseInt(lastActivity)) > 30 * 60 * 1000) {
        // New user or returning after inactivity
        const storedUsers = localStorage.getItem('currentUsers') || '0';
        currentUsers = parseInt(storedUsers) + 1;
        localStorage.setItem('currentUsers', currentUsers);
        sessionStorage.setItem('sessionId', sessionId);
    } else {
        // Existing user, just update activity
        const storedUsers = localStorage.getItem('currentUsers') || '1';
        currentUsers = parseInt(storedUsers);
    }

    // Update last activity timestamp
    localStorage.setItem(`user_${sessionId}_lastActivity`, now);

    // Load working on quiz state from localStorage
    const storedWorking = localStorage.getItem(`user_${sessionId}_workingOnQuiz`);
    workingOnQuiz = storedWorking ? parseInt(storedWorking) : 0;

    // Set up periodic activity update and cleanup
    setInterval(() => {
        localStorage.setItem(`user_${sessionId}_lastActivity`, Date.now());
    }, 60000); // Update every minute

    // Set up periodic info log update every 5 seconds
    setInterval(() => {
        cleanupInactiveUsers();
        updateInfoLog();
        console.log(`[INFO LOG REFRESH] ${new Date().toLocaleTimeString()} - Users: ${currentUsers}, Working on Quiz: ${workingOnQuiz}`);
    }, 5000); // Update every 5 seconds

    // Cleanup inactive users on page load
    cleanupInactiveUsers();

    // Add event listener to decrement user count on page unload
    window.addEventListener('beforeunload', () => {
        const storedUsers = localStorage.getItem('currentUsers');
        let usersCount = storedUsers ? parseInt(storedUsers) : 1;
        usersCount = Math.max(usersCount - 1, 0);
        localStorage.setItem('currentUsers', usersCount);
        // Clear this user's data
        localStorage.removeItem(`user_${sessionId}_lastActivity`);
        localStorage.removeItem(`user_${sessionId}_workingOnQuiz`);
    });

    updateInfoLog();
}

/**
* Generate a unique session ID
*/
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
* Clean up inactive users (simulate server-side cleanup)
*/
function cleanupInactiveUsers() {
    const now = Date.now();
    const keys = Object.keys(localStorage);
    let activeUsers = 0;

    keys.forEach(key => {
        if (key.startsWith('user_') && key.endsWith('_lastActivity')) {
            const lastActivity = parseInt(localStorage.getItem(key));
            if ((now - lastActivity) > 30 * 60 * 1000) { // 30 minutes
                // Remove inactive user data
                const sessionId = key.replace('user_', '').replace('_lastActivity', '');
                localStorage.removeItem(key);
                localStorage.removeItem(`user_${sessionId}_workingOnQuiz`);
            } else {
                activeUsers++;
            }
        }
    });

    // Update current users count based on active users
    if (activeUsers > 0) {
        localStorage.setItem('currentUsers', activeUsers);
        currentUsers = activeUsers;
    }
}

// Call initializeInfoLog on page load
window.addEventListener('load', () => {
    initializeInfoLog();
});

/**
* Toggle loader image between Michelemembuatsoal.png and michellesenyum.png
*/
function toggleLoaderImage() {
    const loaderImage = document.getElementById('loader-image');
    if (currentLoaderImage === 0) {
        loaderImage.src = 'image/michellesenyum.png';
        currentLoaderImage = 1;
    } else {
        loaderImage.src = 'image/Michelemembuatsoal.png';
        currentLoaderImage = 0;
    }
}

// === DATA SARAN MATERI ===
const topicSuggestions = {
    "Matematika": [
        {
            name: "Bilangan",
            details: "Bilangan bulat, pecahan, desimal, bilangan prima, KPK, FPB"
        },
        {
            name: "Aljabar",
            details: "Persamaan linear, kuadrat, sistem persamaan, logaritma, eksponen"
        },
        {
            name: "Geometri",
            details: "Bangun datar, bangun ruang, luas, keliling, volume, teorema Pythagoras"
        },
        {
            name: "Pengukuran",
            details: "Satuan panjang, berat, waktu, suhu, konversi satuan"
        },
        {
            name: "Data dan Peluang",
            details: "Statistik, mean, median, modus, diagram, probabilitas"
        },
        {
            name: "Trigonometri",
            details: "Sinus, cosinus, tangen, identitas trigonometri, aturan sinus-cosinus"
        },
        {
            name: "Kalkulus",
            details: "Limit, turunan, integral, aplikasi kalkulus dalam fisika"
        }
    ],
    "Bahasa Indonesia": [
        {
            name: "Tata Bahasa",
            details: "Kalimat, subjek-predikat-objek, kata kerja, kata benda, kata sifat"
        },
        {
            name: "Puisi",
            details: "Struktur puisi, majas, rima, tema, amanat"
        },
        {
            name: "Prosa",
            details: "Cerita pendek, novel, karakter, plot, setting, konflik"
        },
        {
            name: "Drama",
            details: "Monolog, dialog, tokoh, alur, tema, latar"
        },
        {
            name: "Sastra Lama",
            details: "Pantun, syair, gurindam, hikayat, babad"
        },
        {
            name: "Sastra Modern",
            details: "Puisi modern, cerpen modern, novel modern"
        },
        {
            name: "Bahasa Baku",
            details: "Ejaan yang disempurnakan, tata bahasa baku, kosakata"
        }
    ],
    "Bahasa Inggris": [
        {
            name: "Grammar",
            details: "Tenses, subject-verb agreement, articles, prepositions"
        },
        {
            name: "Vocabulary",
            details: "Synonyms, antonyms, idioms, phrasal verbs, academic words"
        },
        {
            name: "Reading Comprehension",
            details: "Skimming, scanning, main idea, inference, vocabulary in context"
        },
        {
            name: "Writing",
            details: "Essay structure, paragraph development, coherence, cohesion"
        },
        {
            name: "Listening",
            details: "Note-taking, prediction, main ideas, details, inference"
        },
        {
            name: "Speaking",
            details: "Pronunciation, fluency, vocabulary usage, grammar accuracy"
        },
        {
            name: "Literature",
            details: "Poetry analysis, prose, drama, literary devices, themes"
        }
    ]
};

// === FUNGSI-FUNGSI UTAMA ===

/**
* Membuat prompt untuk Gemini API agar mengecek relevansi kategori dan topik
*/
function createRelevanceCheckPrompt(category, topic) {
    return `
    Anda adalah AI yang ahli dalam pendidikan di Indonesia. Evaluasi apakah kategori "${category}" dan topik "${topic}" cocok untuk kuis tingkat SMA di Indonesia.
    
    Kriteria relevansi:
    1. Kategori harus sesuai dengan mata pelajaran SMA di Indonesia (misal: Matematika, Bahasa Indonesia, Bahasa Inggris, Fisika, Kimia, Biologi, Sejarah, Geografi, Ekonomi, Sosiologi, dll.)
    2. Topik harus spesifik dan relevan dengan kategori tersebut, serta sesuai untuk tingkat SMA.
    3. Topik tidak boleh terlalu spesialis atau tidak sesuai dengan kurikulum SMA Indonesia.
    
    Balas HANYA dengan format JSON seperti ini:
    {
      "isRelevant": true/false,
      "reason": "Penjelasan singkat mengapa relevan atau tidak relevan"
    }
    
    Contoh relevan: Kategori "Matematika", Topik "Aljabar Linear" -> {"isRelevant": true, "reason": "Aljabar Linear adalah materi matematika SMA yang standar"}
    Contoh tidak relevan: Kategori "Matematika", Topik "Kalkulus Tingkat Lanjut" -> {"isRelevant": false, "reason": "Kalkulus Tingkat Lanjut lebih cocok untuk perguruan tinggi"}
    `;
}

/**
* Mengecek relevansi kategori dan topik menggunakan Gemini API
*/
async function checkRelevance(category, topic) {
    try {
        const prompt = createRelevanceCheckPrompt(category, topic);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1, // Rendah untuk evaluasi yang konsisten
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jsonString = data.candidates[0].content.parts[0].text;
        
        // Membersihkan string JSON dari markdown backticks
        const cleanedJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const result = JSON.parse(cleanedJson);
        return result;
    } catch (error) {
        console.error("Error checking relevance:", error);
        showAIErrorModal("Gagal memverifikasi relevansi kategori dan topik. Melanjutkan dengan asumsi relevan. Detail: " + error.message);
        // Jika terjadi error, anggap relevan untuk menghindari blokir
        return { isRelevant: true, reason: "Tidak dapat memverifikasi relevansi, melanjutkan dengan asumsi relevan" };
    }
}

/**
* Membuat prompt untuk Gemini API agar mengenerate soal dalam format JSON.
*/
function createQuizPrompt(category, topic, numQuestions) {
    return `
    Anda adalah AI pembuat kuis yang ahli. Buatkan ${numQuestions} soal pilihan ganda tentang materi "${topic}" dalam kategori "${category}".
    Pastikan soal sesuai untuk level SMA di Indonesia.
    Setiap soal harus memiliki 4 pilihan ganda (A, B, C, D).
    
    Untuk setiap soal, sertakan:
    1. "question": Teks pertanyaan.
    2. "options": Sebuah objek dengan kunci "A", "B", "C", "D".
    3. "correctAnswer": Kunci dari jawaban yang benar (misal: "A").
    4. "hint": Satu kalimat petunjuk awal yang tidak terlalu jelas.
    5. "clues": Sebuah array berisi 3 string, dimana setiap string adalah petunjuk tambahan yang semakin jelas.
    6. "explanation": Penjelasan singkat mengapa jawaban tersebut benar.

    Balas HANYA dengan format JSON array seperti contoh di bawah ini, tanpa teks atau markdown tambahan.

    Contoh Format:
    [
      {
        "question": "Siapakah presiden pertama Indonesia?",
        "options": {
          "A": "Soeharto",
          "B": "Soekarno",
          "C": "B.J. Habibie",
          "D": "Joko Widodo"
        },
        "correctAnswer": "B",
        "hint": "Ia dikenal sebagai proklamator kemerdekaan Indonesia.",
        "clues": [
          "Julukannya adalah Bung Karno.",
          "Ia membacakan teks proklamasi pada 17 Agustus 1945.",
          "Makamnya berada di Blitar."
        ],
        "explanation": "Soekarno adalah presiden pertama Indonesia yang juga merupakan salah satu proklamator kemerdekaan."
      }
    ]
    `;
}

/**
* Memanggil Gemini API untuk mendapatkan soal
*/
async function generateQuestions(category, topic, numQuestions) {
    loader.classList.remove('hidden');
    loaderInterval = setInterval(toggleLoaderImage, 500);
    try {
        const prompt = createQuizPrompt(category, topic, numQuestions);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7, // Sedikit kreativitas
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jsonString = data.candidates[0].content.parts[0].text;
        
        // Membersihkan string JSON dari markdown backticks
        const cleanedJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        
        questions = JSON.parse(cleanedJson);
        userAnswers = []; // Reset riwayat jawaban
        startQuiz();
    } catch (error) {
        console.error("Error generating questions:", error);
        showAIErrorModal("Gagal membuat soal. Coba periksa API Key atau koneksi internet Anda. Detail: " + error.message);
        loader.classList.add('hidden');
        if (loaderInterval) {
            clearInterval(loaderInterval);
            loaderInterval = null;
        }
    }
}
    // Membersihkan string JSON dari markdown backticks

/**
* Memulai kuis setelah soal berhasil dibuat
*/
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    cluesUsed = 0; // Reset global clues
    scoreDisplayEl.textContent = `Skor: ${score}`;

    setupModal.classList.add('hidden');
    landingPage.classList.remove('active');
    resultsPage.classList.remove('active');
    quizPage.classList.add('active');
    loader.classList.add('hidden');

    if (loaderInterval) {
        clearInterval(loaderInterval);
        loaderInterval = null;
    }

    // Set working on quiz
    workingOnQuiz = 1;
    updateInfoLog();

    // Hide info log during quiz
    const infoLog = document.getElementById('info-log');
    if (infoLog) {
        infoLog.style.display = 'none';
    }

    displayQuestion();
}

/**
* Menampilkan soal, pilihan, dan petunjuk saat ini
*/
function displayQuestion() {
    if (currentQuestionIndex >= questions.length) {
        showResults();
        return;
    }

    const currentQuestion = questions[currentQuestionIndex];

    questionNumberEl.textContent = currentQuestionIndex + 1;
    totalQuestionsEl.textContent = questions.length;
    questionTextEl.textContent = currentQuestion.question;

    optionsContainer.innerHTML = '';
    Object.entries(currentQuestion.options).forEach(([key, value]) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.dataset.option = key;
        button.innerHTML = `<strong>${key}.</strong> ${value}`;
        optionsContainer.appendChild(button);
    });

    // Reset tampilan petunjuk pengerjaan
    hintTextEl.style.display = 'block';
    addClueBtn.style.display = 'block';
    clueContainer.style.display = 'block';
    const conclusionTextEl = document.getElementById('conclusion-text');
    conclusionTextEl.classList.add('hidden');

    hintTextEl.textContent = currentQuestion.hint;
    clueContainer.innerHTML = '';
    addClueBtn.textContent = `Minta Clue Tambahan (Sisa ${3 - cluesUsed})`;
    addClueBtn.disabled = cluesUsed >= 3;
    nextQuestionBtn.classList.add('hidden');
}


/**
* Menangani ketika pengguna memilih jawaban
*/
function handleAnswerSelection(e) {
    if (!e.target.matches('.option-btn')) return;

    const selectedOption = e.target.dataset.option;
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    
    userAnswers.push({
        question: currentQuestion.question,
        selectedAnswer: selectedOption,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: isCorrect
    });

    if (isCorrect) {
        score++;
        scoreDisplayEl.textContent = `Skor: ${score}`;
        e.target.classList.add('correct');
    } else {
        e.target.classList.add('incorrect');
    }

    // Tampilkan jawaban yang benar
    Array.from(optionsContainer.children).forEach(btn => {
        if (btn.dataset.option === currentQuestion.correctAnswer) {
            btn.classList.add('correct');
        }
        btn.disabled = true; // Nonaktifkan semua tombol setelah menjawab
    });

    // Tampilkan penjelasan singkat setelah menjawab
    showExplanation();

    nextQuestionBtn.classList.remove('hidden');
}


/**
* Menampilkan clue tambahan atau penjelasan setelah menjawab
*/
function addClue() {
    const currentQuestion = questions[currentQuestionIndex];
    if (cluesUsed < 3 && cluesUsed < currentQuestion.clues.length) {
        const clueText = document.createElement('p');
        clueText.textContent = `Clue ${cluesUsed + 1}: ${currentQuestion.clues[cluesUsed]}`;
        clueContainer.appendChild(clueText);
        cluesUsed++;
        addClueBtn.textContent = `Minta Clue Tambahan (Sisa ${3 - cluesUsed})`;

        if (cluesUsed === 3) {
            addClueBtn.disabled = true;
        }
    }
}

/**
* Menampilkan penjelasan singkat setelah menjawab soal
*/
function showExplanation() {
    const currentQuestion = questions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];
    const hintContainer = document.querySelector('.hint-container');
    const conclusionTextEl = document.getElementById('conclusion-text');

    // Sembunyikan petunjuk pengerjaan
    hintTextEl.style.display = 'none';
    addClueBtn.style.display = 'none';
    clueContainer.style.display = 'none';

    // Tampilkan kesimpulan
    const isCorrect = userAnswer.isCorrect;
    const conclusion = isCorrect
        ? `✅ Jawaban Anda benar! ${currentQuestion.explanation}`
        : `❌ Jawaban Anda salah. Jawaban yang benar adalah ${currentQuestion.correctAnswer} (${questions[currentQuestionIndex].options[currentQuestion.correctAnswer]}). ${currentQuestion.explanation}`;

    conclusionTextEl.textContent = conclusion;
    conclusionTextEl.classList.remove('hidden');
}

/**
* Pindah ke soal berikutnya atau tampilkan hasil jika sudah selesai
*/
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        displayQuestion();
    } else {
        showResults();
    }
}

/**
* Menampilkan halaman hasil akhir
*/
function showResults() {
    quizPage.classList.remove('active');
    resultsPage.classList.add('active');

    const percentage = ((score / questions.length) * 100).toFixed(0);
    finalScoreEl.textContent = `Skor Akhir Anda: ${score} dari ${questions.length} (${percentage}%)`;

    // Set not working on quiz
    workingOnQuiz = 0;
    updateInfoLog();

    // Show info log after quiz completion
    const infoLog = document.getElementById('info-log');
    if (infoLog) {
        infoLog.style.display = 'block';
    }

    populateDashboard();

    getAnalysisFromAI();
}

/**
* Menghitung dan menampilkan data analitik di dashboard
*/
function populateDashboard() {
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = ''; // Kosongkan dulu

    // Statistik dasar
    const totalQuestions = questions.length;
    const correctAnswers = score;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const percentage = ((correctAnswers / totalQuestions) * 100).toFixed(0);

    // Hitung jawaban benar dan salah per soal
    const questionStats = questions.map((q, index) => {
        const userAnswer = userAnswers[index];
        return {
            question: q.question,
            correct: userAnswer ? userAnswer.isCorrect : false
        };
    });

    // Buat elemen statistik
    const statsHtml = `
        <p><strong>Total Soal:</strong> ${totalQuestions}</p>
        <p><strong>Jawaban Benar:</strong> ${correctAnswers}</p>
        <p><strong>Jawaban Salah:</strong> ${incorrectAnswers}</p>
        <p><strong>Persentase Benar:</strong> ${percentage}%</p>
    `;

    // Buat elemen ringkasan soal
    let questionSummaryHtml = '<h4>Ringkasan Jawaban Soal:</h4><ul>';
    questionStats.forEach((qs, i) => {
        questionSummaryHtml += `<li>Soal ${i + 1}: ${qs.correct ? '<span style="color:green;">Benar</span>' : '<span style="color:red;">Salah</span>'}</li>`;
    });
    questionSummaryHtml += '</ul>';

    dashboard.innerHTML = statsHtml + questionSummaryHtml;
}

/**
* Meminta analisis dari AI berdasarkan jawaban pengguna
*/
async function getAnalysisFromAI() {
    const prompt = `
    Anda adalah seorang guru yang bijaksana dan suportif.
    Seorang siswa baru saja menyelesaikan kuis dengan hasil berikut:
    Total Soal: ${questions.length}
    Jawaban Benar: ${score}
    
    Berikut adalah riwayat jawaban siswa (jawaban yang salah ditandai):
    ${userAnswers.map((ans, index) => `
    Soal ${index + 1}: ${ans.question}
    Jawaban Siswa: ${ans.selectedAnswer} (${questions[index].options[ans.selectedAnswer]})
    Jawaban Benar: ${ans.correctAnswer} (${questions[index].options[ans.correctAnswer]})
    Hasil: ${ans.isCorrect ? 'Benar' : 'SALAH'}
    `).join('')}

    Tolong berikan analisis singkat dan membangun dalam 2 paragraf. 
    Fokus pada:
    1. Memberikan pujian atas jawaban yang benar.
    2. Mengidentifikasi pola kesalahan (jika ada) dari jawaban yang salah.
    3. Memberikan saran materi apa yang perlu dipelajari lagi.
    4. Gunakan bahasa yang positif dan memotivasi.
    
    Balas HANYA dengan teks analisisnya saja, tanpa pembukaan atau penutup tambahan.
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            })
        });
        const data = await response.json();
        const analysis = data.candidates[0].content.parts[0].text;
        analysisTextEl.innerHTML = analysis.replace(/\n/g, '<br>'); // Tampilkan dengan format paragraf
    } catch (error) {
        console.error("Error getting analysis:", error);
        analysisTextEl.textContent = "Maaf, terjadi kesalahan saat membuat analisis.";
    }
}


/**
* Menampilkan modal saran materi berdasarkan kategori yang dipilih
*/
function showTopicSuggestions() {
    const category = document.getElementById('category').value;
    const suggestionsCategoryEl = document.getElementById('suggestions-category');
    const suggestionsListEl = document.getElementById('suggestions-list');

    suggestionsCategoryEl.textContent = category;
    suggestionsListEl.innerHTML = '';

    const suggestions = topicSuggestions[category] || [];

    suggestions.forEach((suggestion, index) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerHTML = `
            <input type="checkbox" id="suggestion-${index}" value="${suggestion.name}">
            <div class="suggestion-content">
                <h4>${suggestion.name}</h4>
                <p>${suggestion.details}</p>
            </div>
        `;
        suggestionsListEl.appendChild(suggestionItem);
    });

    document.getElementById('topic-suggestions-modal').classList.remove('hidden');
}

/**
* Menerapkan materi yang dipilih ke input field
*/
function applySelectedTopics() {
    const checkboxes = document.querySelectorAll('#suggestions-list input[type="checkbox"]:checked');
    const selectedTopics = Array.from(checkboxes).map(cb => cb.value);

    if (selectedTopics.length > 0) {
        const topicInput = document.getElementById('topic');
        const currentValue = topicInput.value.trim();
        const existingTopics = currentValue ? currentValue.split(',').map(t => t.trim()) : [];

        // Gabungkan topik yang sudah ada dengan yang baru dipilih
        const allTopics = [...new Set([...existingTopics, ...selectedTopics])];
        topicInput.value = allTopics.join(', ');
    }

    document.getElementById('topic-suggestions-modal').classList.add('hidden');
}

/**
* Kembali ke halaman awal dan mereset state
*/
function resetAndGoHome() {
    questions = [];
    userAnswers = [];
    currentQuestionIndex = 0;
    score = 0;

    // Set not working on quiz
    workingOnQuiz = 0;
    updateInfoLog();

    // Show info log after going home
    const infoLog = document.getElementById('info-log');
    if (infoLog) {
        infoLog.style.display = 'block';
    }

    resultsPage.classList.remove('active');
    landingPage.classList.add('active');
    analysisTextEl.innerHTML = `
        <div class="loader-small"></div>
        <p>Sedang menganalisis jawaban Anda...</p>
    `;
}

// === EVENT LISTENERS ===
startBtn.addEventListener('click', () => setupModal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => setupModal.classList.add('hidden'));
const closeRelevanceModalBtn = document.getElementById('close-relevance-modal-btn');
closeRelevanceModalBtn.addEventListener('click', () => {
    const relevanceModal = document.getElementById('relevance-modal');
    relevanceModal.classList.add('hidden');
});

const closeAIErrorModalBtn = document.getElementById('close-ai-error-modal-btn');
closeAIErrorModalBtn.addEventListener('click', () => {
    const aiErrorModal = document.getElementById('ai-error-modal');
    aiErrorModal.classList.add('hidden');
});


// Topic Suggestions Event Listeners
const suggestTopicBtn = document.getElementById('suggest-topic-btn');
const closeSuggestionsModalBtn = document.getElementById('close-suggestions-modal-btn');
const applySuggestionsBtn = document.getElementById('apply-suggestions-btn');

suggestTopicBtn.addEventListener('click', showTopicSuggestions);
closeSuggestionsModalBtn.addEventListener('click', () => {
    document.getElementById('topic-suggestions-modal').classList.add('hidden');
});
applySuggestionsBtn.addEventListener('click', applySelectedTopics);

quizSetupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const category = document.getElementById('category').value;
    const topic = document.getElementById('topic').value;
    const numQuestions = document.getElementById('num-questions').value;

    // Cek relevansi kategori dan topik terlebih dahulu
    loader.classList.remove('hidden');
    const relevanceResult = await checkRelevance(category, topic);
    loader.classList.add('hidden');

    if (!relevanceResult.isRelevant) {
        // Tampilkan popup jika tidak relevan
        const relevanceModal = document.getElementById('relevance-modal');
        const relevanceMessage = document.getElementById('relevance-message');
        relevanceMessage.textContent = relevanceResult.reason;
        relevanceModal.classList.remove('hidden');
        return;
    }

    // Jika relevan, lanjutkan generate soal
    generateQuestions(category, topic, numQuestions);
});

optionsContainer.addEventListener('click', handleAnswerSelection);
addClueBtn.addEventListener('click', addClue);
nextQuestionBtn.addEventListener('click', nextQuestion);
backToHomeBtn.addEventListener('click', resetAndGoHome);