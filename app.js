/**
 * Grok Avto Trade v15.0 - Core Logic
 * Project: SYN WALLET
 */

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Список из 12 монет с актуальными логотипами
const assets = [
    { id: 'TON', name: 'TON', price: 0, cg: 'the-open-network', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ton/info/logo.png' },
    { id: 'BTC', name: 'Bitcoin', price: 0, cg: 'bitcoin', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png' },
    { id: 'USDT', name: 'USDT', price: 0, cg: 'tether', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png' },
    { id: 'ETH', name: 'Ethereum', price: 0, cg: 'ethereum', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
    { id: 'SOL', name: 'Solana', price: 0, cg: 'solana', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png' },
    { id: 'NEAR', name: 'Near', price: 0, cg: 'near', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png' },
    { id: 'USDC', name: 'USDC', price: 0, cg: 'usd-coin', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png' },
    { id: 'DOGE', name: 'Doge', price: 0, cg: 'dogecoin', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png' },
    { id: 'BNB', name: 'BNB', price: 0, cg: 'binancecoin', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png' },
    { id: 'LTC', name: 'Litecoin', price: 0, cg: 'litecoin', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/litecoin/info/logo.png' },
    { id: 'SUI', name: 'Sui', price: 0, cg: 'sui', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png' },
    { id: 'POL', name: 'Polygon', price: 0, cg: 'matic-network', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png' }
];

let swapFrom = "TON", swapTo = "USDT", activePicker = "", currentAddr = "";

// 1. Инициализация приложения
function init() {
    const list = document.getElementById('asset_list'); 
    if(list) {
        list.innerHTML = assets.map(a => `
            <div class="asset-item" onclick="showAssetMenu('${a.id}')">
                <div class="asset-icon-box"><img src="${a.img}" class="asset-icon-img"></div>
                <div class="asset-details">
                    <div class="asset-name">${a.id}</div>
                    <div class="asset-price" id="price_${a.id}">$0.00</div>
                </div>
                <div class="bal-amount">0.00</div>
            </div>`).join('');
    }
    
    updatePrices();
    setInterval(updatePrices, 30000); // Обновление цен каждые 30 сек
    updateSwapUI();
    
    // Подключение TON Connect
    const tc = new TON_CONNECT_UI.TonConnectUI({ 
        manifestUrl: 'https://sergey52bb.github.io/grok-autotrade/tonconnect-manifest.json', 
        buttonRootId: 'ton-connect-btn' 
    });
    
    tc.onStatusChange(w => { 
        if (w) { 
            currentAddr = w.account.address;
            document.getElementById('addr_display').innerText = currentAddr.substring(0,8)+"...";
            document.getElementById('full_addr').innerText = currentAddr;
            document.getElementById("qrcode").innerHTML = "";
            new QRCode(document.getElementById("qrcode"), { text: currentAddr, width: 150, height: 150 });
        } 
    });
}

// 2. Обновление цен через CoinGecko
async function updatePrices() {
    try {
        const ids = assets.map(a => a.cg).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
        const data = await res.json();
        assets.forEach(a => {
            if(data[a.cg]) {
                a.price = data[a.cg].usd;
                const priceEl = document.getElementById(`price_${a.id}`);
                if(priceEl) {
                    const formattedPrice = a.price < 1 ? a.price.toFixed(4) : a.price.toLocaleString();
                    priceEl.innerText = `$${formattedPrice}`;
                }
            }
        });
        calculateSwap();
    } catch(e) { console.log("Price update failed"); }
}

// 3. Навигация между вкладками
window.showTab = function(id, el) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('scr_'+id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
}

// 4. Меню актива (Исправлено: логотипы на скринах 2, 3, 4)
window.showAssetMenu = function(id) {
    const a = assets.find(x => x.id === id);
    
    // Заголовок модалки с логотипом
    document.getElementById('menu_title').innerHTML = `
        <div class="modal-header-coin" style="display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:15px;">
            <img src="${a.img}" style="width:32px; height:32px; border-radius:50%;">
            <span style="font-size:20px; font-weight:800;">${a.name}</span>
        </div>
    `;
    
    // Логотип в подразделах Receive/Send
    document.querySelectorAll('.cur_asset').forEach(e => {
        e.innerHTML = `<img src="${a.img}" style="width:18px; height:18px; vertical-align:middle; margin-right:5px; border-radius:50%;"> ${a.id}`;
    });
    
    switchModalView('menu');
    document.getElementById('universal_modal').style.display = 'flex';
}

// 5. Управление модальными окнами
window.closeModal = function(id) { 
    document.getElementById(id).style.display = 'none'; 
}

window.switchModalView = function(v) {
    document.querySelectorAll('.modal-view').forEach(x => x.classList.remove('active'));
    const target = document.getElementById('view_' + v);
    if(target) target.classList.add('active');
}

// 6. Копирование адреса
window.copyAddr = function() {
    const addrText = document.getElementById('full_addr').innerText;
    if(addrText === "Disconnected" || !addrText) { 
        tg.showAlert("Please connect wallet first!"); 
        return; 
    }
    navigator.clipboard.writeText(addrText).then(() => { 
        tg.showAlert("Address Copied!"); 
    });
}

// 7. Выбор монет в обменнике (Исправлено: Скрин 6, 7)
window.openCoinPicker = function(type) {
    activePicker = type;
    const list = document.getElementById('coin_options_list'); 
    list.innerHTML = "";
    const forbidden = type === 'from' ? swapTo : swapFrom;
    
    assets.forEach(a => {
        if(a.id === forbidden) return;
        list.innerHTML += `
            <div class="coin-option" onclick="selectCoin('${a.id}')" style="display:flex; align-items:center; gap:15px; padding:15px; border-bottom:1px solid var(--border); cursor:pointer;">
                <img src="${a.img}" style="width:32px; height:32px; border-radius:50%; flex-shrink:0;">
                <div class="coin-ticker" style="font-weight:700; font-size:16px;">${a.id}</div>
            </div>`;
    });
    document.getElementById('picker_modal').style.display = 'flex';
}

window.selectCoin = function(id) { 
    if(activePicker === 'from') swapFrom = id; else swapTo = id; 
    updateSwapUI(); 
    closeModal('picker_modal'); 
}

// 8. Логика обмена (Swap)
function updateSwapUI() {
    const from = assets.find(x => x.id === swapFrom);
    const to = assets.find(x => x.id === swapTo);
    
    if(document.getElementById('sw_from_img')) document.getElementById('sw_from_img').src = from.img;
    if(document.getElementById('sw_from_txt')) document.getElementById('sw_from_txt').innerText = swapFrom;
    if(document.getElementById('sw_to_img')) document.getElementById('sw_to_img').src = to.img;
    if(document.getElementById('sw_to_txt')) document.getElementById('sw_to_txt').innerText = swapTo;
    
    calculateSwap();
}

window.calculateSwap = function() {
    const valInput = document.getElementById('sw_val');
    const resInput = document.getElementById('sw_res');
    if(!valInput || !resInput) return;

    const val = valInput.value;
    const assetFrom = assets.find(x => x.id === swapFrom);
    const assetTo = assets.find(x => x.id === swapTo);
    
    if(val > 0 && assetFrom.price > 0 && assetTo.price > 0) {
        resInput.value = ((val * assetFrom.price) / assetTo.price).toFixed(6);
    } else { 
        resInput.value = "0.0"; 
    }
}

window.swapReverse = function() { 
    const tmp = swapFrom; 
    swapFrom = swapTo; 
    swapTo = tmp; 
    updateSwapUI(); 
}

// Запуск при загрузке
window.onload = init;
