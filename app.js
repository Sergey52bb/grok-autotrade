const tg = window.Telegram.WebApp; 
tg.ready(); 
tg.expand();

// Полный список монет с правильными ID для цен (CoinGecko)
const assets = [
    { id: 'TON', name: 'TON', price: 0, cg: 'the-open-network', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ton/info/logo.png' },
    { id: 'BTC', name: 'Bitcoin', price: 0, cg: 'bitcoin', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png' },
    { id: 'ETH', name: 'Ethereum', price: 0, cg: 'ethereum', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
    { id: 'USDT', name: 'USDT', price: 0, cg: 'tether', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png' },
    { id: 'USDC', name: 'USDC', price: 0, cg: 'usd-coin', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png' },
    { id: 'BNB', name: 'BNB', price: 0, cg: 'binancecoin', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png' },
    { id: 'DOGE', name: 'Dogecoin', price: 0, cg: 'dogecoin', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0xba2ae424d960c2397b903588900c14463d1c024d/logo.png' },
    { id: 'LTC', name: 'Litecoin', price: 0, cg: 'litecoin', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/litecoin/info/logo.png' },
    { id: 'NEAR', name: 'Near', price: 0, cg: 'near', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png' },
    { id: 'SUI', name: 'Sui', price: 0, cg: 'sui', img: 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.png' },
    { id: 'MATIC', name: 'Polygon', price: 0, cg: 'matic-network', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7D1Afa7B718fb893dB30A3aBc0Cfc608AaCfeBB0/logo.png' }
];

let swapFrom = "TON", swapTo = "USDT", activePicker = "", currentAddr = "";

// Функция обновления цен
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
    } catch(e) { console.error("Price error:", e); }
}

// Инициализация кошелька и списка
function init() {
    const list = document.getElementById('asset_list'); 
    if(list) {
        list.innerHTML = "";
        assets.forEach(a => {
            list.innerHTML += `
                <div class="asset-item" onclick="showAssetMenu('${a.id}')">
                    <div class="asset-icon-box"><img src="${a.img}" class="asset-icon-img"></div>
                    <div class="asset-details">
                        <div class="asset-name">${a.id}</div>
                        <div class="asset-price" id="price_${a.id}">$0.00</div>
                    </div>
                    <div class="bal-amount">0.00</div>
                </div>`;
        });
    }
    
    updatePrices();
    setInterval(updatePrices, 30000);
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
        } else {
            document.getElementById('addr_display').innerText = "Disconnected";
        }
    });
}

// Навигация
window.showTab = function(id, el) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('scr_'+id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
};

// Меню монеты
window.showAssetMenu = function(id) {
    const a = assets.find(x => x.id === id);
    document.getElementById('menu_title').innerText = a.name;
    document.getElementById('modal_main_icon').src = a.img;
    document.getElementById('modal_deposit_icon').src = a.img;
    document.getElementById('modal_send_icon').src = a.img;
    document.querySelectorAll('.cur_asset').forEach(e => e.innerText = a.id);
    switchModalView('menu');
    document.getElementById('universal_modal').style.display = 'flex';
};

window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };

window.switchModalView = function(v) {
    document.querySelectorAll('.modal-view').forEach(x => x.classList.remove('active'));
    document.getElementById('view_' + v).classList.add('active');
};

window.copyAddr = function() {
    const addrText = document.getElementById('full_addr').innerText;
    if(addrText === "Disconnected") { tg.showAlert("Сначала подключите кошелек!"); return; }
    navigator.clipboard.writeText(addrText).then(() => { tg.showAlert("Адрес скопирован!"); });
};

// Swap логика
window.openCoinPicker = function(type) {
    activePicker = type;
    const list = document.getElementById('coin_options_list'); 
    list.innerHTML = "";
    const forbidden = type === 'from' ? swapTo : swapFrom;
    assets.forEach(a => {
        if(a.id === forbidden) return;
        list.innerHTML += `<div class="coin-option" onclick="selectCoin('${a.id}')"><img src="${a.img}"><div class="coin-ticker">${a.id}</div></div>`;
    });
    document.getElementById('picker_modal').style.display = 'flex';
};

window.selectCoin = function(id) { 
    if(activePicker === 'from') swapFrom = id; else swapTo = id; 
    updateSwapUI(); 
    closeModal('picker_modal'); 
};

function updateSwapUI() {
    const fromImg = document.getElementById('sw_from_img');
    const toImg = document.getElementById('sw_to_img');
    if(fromImg && toImg) {
        fromImg.src = assets.find(x => x.id === swapFrom).img;
        document.getElementById('sw_from_txt').innerText = swapFrom;
        toImg.src = assets.find(x => x.id === swapTo).img;
        document.getElementById('sw_to_txt').innerText = swapTo;
        calculateSwap();
    }
}

window.calculateSwap = function() {
    const valInput = document.getElementById('sw_val');
    const resInput = document.getElementById('sw_res');
    if(!valInput || !resInput) return;
    const val = parseFloat(valInput.value);
    const assetFrom = assets.find(x => x.id === swapFrom);
    const assetTo = assets.find(x => x.id === swapTo);
    if(val > 0 && assetFrom.price > 0 && assetTo.price > 0) {
        resInput.value = ((val * assetFrom.price) / assetTo.price).toFixed(6);
    } else { resInput.value = "0.0"; }
};

window.swapReverse = function() { 
    const tmp = swapFrom; swapFrom = swapTo; swapTo = tmp; 
    updateSwapUI(); 
};

// Слушатель ввода для свапа
document.addEventListener('input', (e) => {
    if(e.target.id === 'sw_val') calculateSwap();
});

window.onload = init;
