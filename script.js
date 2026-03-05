/* ============================================
   EMPÓRIO GLAM - Formulário Baby
   Logic & State Management
   ============================================ */

// === CONFIG ===
const CONFIG = {
    webhookUrl: 'https://webhook.sellflux.app/v2/webhook/custom/302a4e4c54d52368722ed8a3794a202b',
    whatsappNumber: '556298008182',
    whatsappBaseUrl: 'https://wa.me/',
};

// === STATE ===
const formData = {
    idade_bebe: '',
    produto: '',
    decisao: '',
    banho: '',
    nome_gravacao: '',
    nome_cliente: '',
    telefone: '',
    // Colar fields
    banho_colar: '',
    colar_nome_bebe: '',
    colar_data_nasc: '',
    colar_peso: '',
    colar_tamanho: '',
    produto_extra: '',
};

const history = [];  // Navigation history for back button
let currentScreen = 'screen-1';

// === PROGRESS MAP (screen → percentage) ===
const progressMap = {
    'screen-1': 14,
    'screen-recem': 25,
    'screen-2a': 30,
    'screen-2b': 28,
    'screen-3a': 50,
    'screen-3b': 50,
    'screen-sem-interesse': 50,
    'screen-3b-banho': 60,
    'screen-4a': 70,
    'screen-upsell-colar': 75,
    'screen-4b': 70,
    'screen-dados': 85,
    'screen-confirmacao': 100,
};

// === NAVIGATION ===

function navigateTo(screenId) {
    const currentEl = document.getElementById(currentScreen);
    const nextEl = document.getElementById(screenId);

    if (!currentEl || !nextEl) return;

    // Push to history
    history.push(currentScreen);

    // Animate out
    currentEl.classList.add('exit');

    setTimeout(() => {
        currentEl.classList.remove('active', 'exit');
        nextEl.classList.add('active');
        currentScreen = screenId;

        // Update progress bar
        updateProgress(screenId);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 250);
}

function goBack() {
    if (history.length === 0) return;

    const prevScreenId = history.pop();
    const currentEl = document.getElementById(currentScreen);
    const prevEl = document.getElementById(prevScreenId);

    if (!currentEl || !prevEl) return;

    currentEl.classList.remove('active');
    prevEl.classList.add('active');
    currentScreen = prevScreenId;

    updateProgress(prevScreenId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress(screenId) {
    const bar = document.getElementById('progressBar');
    const pct = progressMap[screenId] || 14;
    bar.style.width = pct + '%';
}

// === OPTION SELECTION ===

function selectOption(variable, button, produto) {
    const value = button.dataset.value;
    const nextScreen = button.dataset.next;

    // Store value
    formData[variable] = value;

    // Set produto if provided
    if (produto) {
        formData.produto = produto;
    }

    // Pixel: track product selection
    if (variable === 'decisao' && (value === 'personalizar' || value === 'whatsapp')) {
        if (typeof fbq !== 'undefined') fbq('trackCustom', 'ProdutoEscolhido', { produto: formData.produto, decisao: value });
    }

    // Visual feedback - mark selected
    const group = button.closest('.options-group');
    group.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');

    // Delay then navigate
    setTimeout(() => {
        navigateTo(nextScreen);
    }, 350);
}

// === NOME GRAVAÇÃO ===

function setupNomeGravacao() {
    const input = document.getElementById('input-nome-gravacao');
    const btn = document.getElementById('btn-nome-gravacao');

    if (!input || !btn) return;

    input.addEventListener('input', function () {
        const val = this.value.trim();
        btn.disabled = val.length === 0;
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && this.value.trim().length > 0) {
            submitNomeGravacao();
        }
    });
}

function submitNomeGravacao() {
    const input = document.getElementById('input-nome-gravacao');
    const val = input.value.trim();
    if (val.length === 0) return;

    formData.nome_gravacao = val;

    // Pixel: personalization complete
    if (typeof fbq !== 'undefined') fbq('trackCustom', 'PersonalizacaoCompleta', { nome: val, produto: 'pulseira_baby' });

    navigateTo('screen-upsell-colar');
}

// === COLAR PERSONALIZATION ===

function submitColarData(e) {
    e.preventDefault();

    const nomeBebe = document.getElementById('input-nome-bebe').value.trim();
    const dataNasc = document.getElementById('input-data-nasc').value.trim();
    const peso = document.getElementById('input-peso').value.trim();
    const tamanho = document.getElementById('input-tamanho').value.trim();

    if (!nomeBebe) {
        shakeElement(document.getElementById('input-nome-bebe'));
        return;
    }

    formData.colar_nome_bebe = nomeBebe;
    formData.colar_data_nasc = dataNasc;
    formData.colar_peso = peso;
    formData.colar_tamanho = tamanho;

    navigateTo('screen-dados');
}

// === PHONE MASK ===

function setupPhoneMask() {
    const input = document.getElementById('input-telefone');
    if (!input) return;

    input.addEventListener('input', function (e) {
        let val = this.value.replace(/\D/g, '');

        if (val.length > 11) val = val.slice(0, 11);

        if (val.length > 6) {
            this.value = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
        } else if (val.length > 2) {
            this.value = `(${val.slice(0, 2)}) ${val.slice(2)}`;
        } else if (val.length > 0) {
            this.value = `(${val}`;
        }
    });

    // Prevent non-numeric chars
    input.addEventListener('keypress', function (e) {
        if (!/[\d]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
            // Allow navigation keys
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                e.preventDefault();
            }
        }
    });
}

// === FORM SUBMISSION ===

async function submitForm(e) {
    e.preventDefault();

    const nome = document.getElementById('input-nome').value.trim();
    const telefone = document.getElementById('input-telefone').value.trim();

    // Validate
    if (!nome || !telefone) {
        shakeElement(document.getElementById('form-dados'));
        return;
    }

    // Phone must have at least 14 chars with mask: (XX) XXXXX-XXXX
    if (telefone.length < 14) {
        shakeElement(document.getElementById('input-telefone'));
        return;
    }

    formData.nome_cliente = nome;
    formData.telefone = telefone;

    // Show loading
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');
    const btnSubmit = document.getElementById('btn-submit');
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    btnSubmit.disabled = true;

    // Send to webhook
    try {
        await sendWebhook();
    } catch (err) {
        console.warn('Webhook error (continuing anyway):', err);
    }

    // Fire pixel lead events
    fireLeadPixelEvents();

    // Show confirmation
    showConfirmation();
}

function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = 'shake 0.4s ease';
    setTimeout(() => { el.style.animation = ''; }, 400);
}

// Add shake keyframes dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }
`;
document.head.appendChild(shakeStyle);

// === WEBHOOK ===

async function sendWebhook() {
    // Build tags array based on lead selections
    const tags = [];
    if (formData.idade_bebe === 'mais_4_meses') {
        tags.push('lead-mais-4-meses');
    }

    const payload = {
        idade_bebe: formData.idade_bebe,
        produto: formData.produto,
        decisao: formData.decisao,
        banho: formData.banho || '',
        nome_gravacao: formData.nome_gravacao || '',
        nome_cliente: formData.nome_cliente,
        telefone: formData.telefone,
        banho_colar: formData.banho_colar || '',
        colar_nome_bebe: formData.colar_nome_bebe || '',
        colar_data_nasc: formData.colar_data_nasc || '',
        colar_peso: formData.colar_peso || '',
        colar_tamanho: formData.colar_tamanho || '',
        produto_extra: formData.produto_extra || '',
        tags: tags,
        origem: 'formulario_baby_personalizado',
        data: new Date().toISOString(),
    };

    const response = await fetch(CONFIG.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
    }

    return response;
}

// Pixel: fire lead events after successful webhook
function fireLeadPixelEvents() {
    if (typeof fbq === 'undefined') return;
    fbq('trackCustom', 'LeadCompleto', { produto: formData.produto });
    if (formData.produto === 'pulseira_baby') {
        fbq('trackCustom', 'LeadPulseira', { banho: formData.banho, nome: formData.nome_gravacao });
    } else {
        fbq('trackCustom', 'LeadColar', { banho: formData.banho_colar, nome: formData.colar_nome_bebe });
    }
    if (formData.produto_extra === 'quero_colar') {
        fbq('trackCustom', 'LeadColar', { banho: formData.banho_colar, nome: formData.colar_nome_bebe, via_upsell: true });
    }
}

// === HELPERS ===

function formatBanho(val) {
    const map = { ouro_18k: 'Ouro 18k', prata_50: 'Prata 50' };
    return map[val] || val;
}

// === CONFIRMATION ===

function showConfirmation() {
    // Set confirmation text based on product
    const textoEl = document.getElementById('confirmacao-texto');
    if (formData.produto === 'colar_maternidade') {
        textoEl.textContent = 'Nossa consultora vai te chamar no WhatsApp para personalizar o colar maternidade!';
    } else {
        textoEl.textContent = 'Nossa consultora vai te chamar no WhatsApp para finalizar a pulseirinha do seu bebê!';
    }

    // Set WhatsApp link
    const whatsappLink = document.getElementById('whatsapp-link');
    const message = buildWhatsAppMessage();
    whatsappLink.href = `${CONFIG.whatsappBaseUrl}${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;

    navigateTo('screen-confirmacao');
}

function buildWhatsAppMessage() {
    if (formData.produto === 'pulseira_baby') {
        let msg = `Oi, vim do formulario do personalizado baby\n\n`;
        msg += `Produto: Pulseira Baby\n`;
        msg += `Idade: ${formatIdade(formData.idade_bebe)}\n`;
        if (formData.banho) msg += `Banho: ${formatBanho(formData.banho)}\n`;
        if (formData.nome_gravacao) msg += `Nome: ${formData.nome_gravacao}\n`;
        if (formData.produto_extra) msg += `\nProduto: Colar Maternidade\n`;
        if (formData.banho_colar) msg += `Banho colar: ${formatBanho(formData.banho_colar)}\n`;
        if (formData.colar_nome_bebe) msg += `Nome bebe: ${formData.colar_nome_bebe}\n`;
        if (formData.colar_data_nasc) msg += `Nascimento: ${formData.colar_data_nasc}\n`;
        if (formData.colar_peso) msg += `Peso: ${formData.colar_peso}\n`;
        if (formData.colar_tamanho) msg += `Tamanho: ${formData.colar_tamanho}\n`;
        msg += `\n${formData.nome_cliente}`;
        return msg;
    } else {
        let msg = `Oi, vim do formulario do personalizado baby\n\n`;
        msg += `Produto: Colar Maternidade\n`;
        if (formData.banho_colar) msg += `Banho: ${formatBanho(formData.banho_colar)}\n`;
        if (formData.colar_nome_bebe) msg += `Nome: ${formData.colar_nome_bebe}\n`;
        if (formData.colar_data_nasc) msg += `Nascimento: ${formData.colar_data_nasc}\n`;
        if (formData.colar_peso) msg += `Peso: ${formData.colar_peso}\n`;
        if (formData.colar_tamanho) msg += `Tamanho: ${formData.colar_tamanho}\n`;
        msg += `\n${formData.nome_cliente}`;
        return msg;
    }
}

function formatIdade(val) {
    const map = {
        'ainda_nao_nasceu': 'Ainda não nasceu',
        '1_a_4_meses': '1 a 4 meses',
        'mais_4_meses': '+ de 4 meses',
    };
    return map[val] || val;
}

function formatBanho(val) {
    const map = {
        'ouro_18k': 'Ouro 18k (dourado)',
        'prata_50': 'Prata 50 (prateado)',
    };
    return map[val] || val;
}

// === INIT ===

document.addEventListener('DOMContentLoaded', function () {
    setupNomeGravacao();
    setupPhoneMask();
});
