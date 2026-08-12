let modoVarredura = "quick";
let ameacasCount = 0;
let quarentenaLista = [];

// Canvas - Monitor de Desempenho
const canvas = document.getElementById("perfChart");
const ctx = canvas.getContext("2d");
let dataPoints = Array(20).fill(10);

function desenharGrafico() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = "#38bdf8";
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
}, 500);

// NAVEGAÇÃO DE ABAS
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        document.getElementById(targetTab).classList.add('active');
    });
});

// NOTIFICAÇÕES TOAST
function mostrarToast(mensagem, tipo = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = mensagem;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// MODO DE ESCANEAMENTO
document.querySelectorAll('.scan-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
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

// SISTEMA DE VARREDURA
function iniciarVarredura() {
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
    let arquivos = 0;

    adicionarLog(`Iniciando varredura [${modoVarredura.toUpperCase()}]`);

    const intervalo = setInterval(() => {
        progresso += 10;
        arquivos += Math.floor(Math.random() * 30) + 10;

        progressBar.style.width = progresso + "%";
        percentText.textContent = progresso + "%";
        document.getElementById("files-count").textContent = arquivos;

        if (progresso === 50 && modoVarredura === "full") {
            ameacasCount++;
            document.getElementById("threats-count").textContent = ameacasCount;
            document.getElementById("system-status").textContent = "Ameaça Detectada";
            document.getElementById("system-status").className = "stat-value threat";
            threatAlert.classList.remove("hidden");
            adicionarLog("ALERTA: Trojan.Win32.Injector localizado!", "danger");
            mostrarToast("⚠️ Ameaça encontrada no sistema!", "danger");
        } else {
            adicionarLog(`Escanear arquivo: ${Math.random().toString(36).substring(7)}.dll`);
        }

        if (progresso >= 100) {
            clearInterval(intervalo);
            radar.classList.remove("scanning");
            btn.disabled = false;
            
            if (modoVarredura === "quick") {
                document.getElementById("system-status").textContent = "Protegido";
                document.getElementById("system-status").className = "stat-value safe";
                adicionarLog("Varredura concluída. Nenhum problema encontrado.", "success");
                mostrarToast("Escaneamento concluído: Sistema Seguro.");
            }
        }
    }, 200);
}

// GERENCIADOR DE QUARENTENA
function moverParaQuarentena() {
    document.getElementById("threat-alert").classList.add("hidden");
    
    const item = {
        id: Date.now(),
        nome: "payload_malware.exe",
        ameaca: "Trojan.Win32.Injector",
        data: new Date().toLocaleTimeString()
    };

    quarentenaLista.push(item);
    atualizarTabelaQuarentena();
    
    document.getElementById("system-status").textContent = "Protegido";
    document.getElementById("system-status").className = "stat-value safe";
    adicionarLog("Ameaça isolada e enviada à quarentena.", "success");
    mostrarToast("Arquivo enviado para a Quarentena.");
}

function atualizarTabelaQuarentena() {
    const tbody = document.getElementById("quarantine-tbody");
    document.getElementById("badge-quarantine").textContent = quarentenaLista.length;

    if (quarentenaLista.length === 0) {
        tbody.innerHTML = `<tr id="empty-quarantine"><td colspan="4" style="text-align:center; color: var(--text-secondary);">Nenhum arquivo na quarentena.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    quarentenaLista.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.nome}</td>
            <td style="color: var(--accent-red);">${item.ameaca}</td>
            <td>${item.data}</td>
            <td>
                <button class="action-btn delete" onclick="excluirAmeaca(${item.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function excluirAmeaca(id) {
    quarentenaLista = quarentenaLista.filter(item => item.id !== id);
    atualizarTabelaQuarentena();
    mostrarToast("Arquivo excluído permanentemente.");
}

// TOGGLE DE PROTEÇÃO
function toggleShield(checkbox) {
    const badge = document.getElementById("shield-badge");
    if (checkbox.checked) {
        badge.className = "shield-status-badge";
        badge.innerHTML = `<span class="status-dot"></span> Proteção Ativa`;
        mostrarToast("Proteção em Tempo Real Ativada.");
    } else {
        badge.className = "shield-status-badge disabled";
        badge.innerHTML = `<span class="status-dot"></span> Proteção Desativada`;
        mostrarToast("Aviso: Proteção Desativada!");
    }
}
