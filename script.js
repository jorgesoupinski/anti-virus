// --- SINTETIZADOR DE ÁUDIO (Web Audio API) ---
class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playBeep(freq = 440, type = 'sine', duration = 0.1) {
        if (!document.getElementById('toggle-sound').checked) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playAlert() {
        this.playBeep(880, 'sawtooth', 0.15);
        setTimeout(() => this.playBeep(440, 'sawtooth', 0.2), 150);
    }
}

const audio = new AudioEngine();

// --- ESTADO GLOBAL DA APLICAÇÃO ---
let modoVarredura = "quick";
let ameacasCount = parseInt(localStorage.getItem('cs_threats')) || 0;
let arquivosAnalisadosTotal = parseInt(localStorage.getItem('cs_files')) || 0;
let quarentenaLista = JSON.parse(localStorage.getItem('cs_quarantine')) || [];

document.getElementById('threats-count').textContent = ameacasCount;
document.getElementById('files-count').textContent = arquivosAnalisadosTotal;

// --- CANVAS: DESEMPENHO EM TEMPO REAL ---
const canvas = document.getElementById("perfChart");
const ctx = canvas.getContext("2d");
let dataPoints = Array(25).fill(10);

function desenharGrafico() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 2;

    const step = canvas.width / (dataPoints.length - 1);
    dataPoints.forEach((pt, index) => {
        const x = index * step;
        const y = canvas.height - (pt / 100) * canvas.height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

setInterval(() => {
    const isScanning = document.getElementById("radar-circle").classList.contains("scanning");
    const novoValor = isScanning ? Math.floor(Math.random() * 45) + 50 : Math.floor(Math.random() * 15) + 5;
    dataPoints.shift();
    dataPoints.push(novoValor);
    desenharGrafico();
}, 400);

// --- GERENCIADOR DE ABAS ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        audio.playBeep(600, 'sine', 0.05);

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        document.getElementById(targetTab).classList.add('active');
    });
});

// --- TOAST NOTIFICATIONS ---
function mostrarToast(mensagem, tipo = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = mensagem;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// --- TIPOS DE ESCANEAMENTO ---
document.querySelectorAll('.scan-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        audio.playBeep(700, 'sine', 0.05);
        document.querySelectorAll('.scan-type-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        modoVarredura = e.target.getAttribute('data-type');
    });
});

function adicionarLog(texto, tipo = "") {
    const log = document.getElementById("terminal-log");
    const p = document.createElement("p");
    p.className = `log-line ${tipo}`;
    p.textContent = `[${new Date().toLocaleTimeString()}] ${texto}`;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
}

// --- ESCANEAMENTO ---
function iniciarVarredura() {
    audio.playBeep(523, 'triangle', 0.2);
    const btn = document.getElementById("scan-btn");
    const progressBar = document.getElementById("progress-bar");
    const percentText = document.getElementById("progress-percent");
    const radar = document.getElementById("radar-circle");
    const threatAlert = document.getElementById("threat-alert");

    btn.disabled = true;
    progressBar.style.width = "0%";
    percentText.textContent = "0%";
    radar.classList.add("scanning");
    threatAlert.classList.add("hidden");

    let progresso = 0;
    let arquivosSessao = 0;

    adicionarLog(`Iniciando varredura heurística [${modoVarredura.toUpperCase()}]`);

    const intervalo = setInterval(() => {
        progresso += 5;
        arquivosSessao += Math.floor(Math.random() * 40) + 10;
        arquivosAnalisadosTotal += arquivosSessao;
        
        localStorage.setItem('cs_files', arquivosAnalisadosTotal);
        document.getElementById("files-count").textContent = arquivosAnalisadosTotal;

        progressBar.style.width = progresso + "%";
        percentText.textContent = progresso + "%";

        if (progresso === 50 && modoVarredura === "full") {
            audio.playAlert();
            ameacasCount++;
            localStorage.setItem('cs_threats', ameacasCount);
            document.getElementById("threats-count").textContent = ameacasCount;
            
            document.getElementById("system-status").textContent = "Ameaça Detectada";
            document.getElementById("system-status").className = "stat-value threat";
            
            threatAlert.classList.remove("hidden");
            adicionarLog("ALERTA: Arquivo malicioso identificado!", "danger");
            mostrarToast("⚠️ Ameaça Crítica Detectada!", "danger");
        } else {
            audio.playBeep(1200, 'sine', 0.02);
            adicionarLog(`Analisando setor de memória: 0x${Math.floor(Math.random() * 0xFFFFFF).toString(16)}`);
        }

        if (progresso >= 100) {
            clearInterval(intervalo);
            radar.classList.remove("scanning");
            btn.disabled = false;
            
            if (modoVarredura === "quick") {
                audio.playBeep(800, 'sine', 0.3);
                document.getElementById("system-status").textContent = "Protegido";
                document.getElementById("system-status").className = "stat-value safe";
                adicionarLog("Varredura concluída. Sistema seguro.", "success");
                mostrarToast("Escaneamento concluído: 0 ameaças.");
            }
        }
    }, 150);
}

// --- QUARENTENA E PERSISTÊNCIA ---
function moverParaQuarentena() {
    audio.playBeep(900, 'triangle', 0.15);
    document.getElementById("threat-alert").classList.add("hidden");
    
    const item = {
        id: Date.now(),
        nome: "payload_malware.exe",
        ameaca: "Trojan.Win32.Heuristic",
        data: new Date().toLocaleTimeString()
    };

    quarentenaLista.push(item);
    localStorage.setItem('cs_quarantine', JSON.stringify(quarentenaLista));
    
    atualizarTabelaQuarentena();
    
    document.getElementById("system-status").textContent = "Protegido";
    document.getElementById("system-status").className = "stat-value safe";
    adicionarLog("Ameaça neutralizada e isolada.", "success");
    mostrarToast("Arquivo movido para a Quarentena.");
}

function atualizarTabelaQuarentena() {
    const tbody = document.getElementById("quarantine-tbody");
    document.getElementById("badge-quarantine").textContent = quarentenaLista.length;

    if (quarentenaLista.length === 0) {
        tbody.innerHTML = `<tr id="empty-quarantine"><td colspan="4" style="text-align:center; color: var(--text-secondary);">Nenhum arquivo em quarentena no momento.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    quarentenaLista.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.nome}</td>
            <td style="color: var(--accent-red); font-weight: bold;">${item.ameaca}</td>
            <td>${item.data}</td>
            <td>
                <button class="action-btn" onclick="excluirAmeaca(${item.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function excluirAmeaca(id) {
    audio.playBeep(300, 'sawtooth', 0.1);
    quarentenaLista = quarentenaLista.filter(item => item.id !== id);
    localStorage.setItem('cs_quarantine', JSON.stringify(quarentenaLista));
    atualizarTabelaQuarentena();
    mostrarToast("Ameaça removida do disco.");
}

// --- CONTROLE DE PROTEÇÃO ---
function toggleShield(checkbox) {
    audio.playBeep(500, 'sine', 0.1);
    const badge = document.getElementById("shield-badge");
    const badgeText = document.getElementById("shield-badge-text");

    if (checkbox.checked) {
        badge.className = "shield-status-badge";
        badgeText.textContent = "Proteção Ativa";
        mostrarToast("Escudo de Proteção Ativado.");
    } else {
        badge.className = "shield-status-badge disabled";
        badgeText.textContent = "Proteção Desativada";
        mostrarToast("Aviso: O sistema está vulnerável!");
    }
}

// Carregar Quarentena Inicial
atualizarTabelaQuarentena();
