const tg = window.Telegram.WebApp;
tg.ready(); tg.expand();

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

async function updatePrices() {
    try {
        const ids = assets.map(a => a.cg).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
        const data = await res.json();
        assets.forEach(a => {
            if(data[a.cg]) {
                a.price = data[a.cg].usd;
                const el = document.getElementById(`price_${a.id}`);
                if(el) el.innerText = `$${a.price < 1 ? a.price.toFixed(4) : a.price.toLocaleString()}`;
            }
        });
        calculateSwap();
    } catch(e) {}
}

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
    
    // Добавляем класс вращения логотипу (Скрин 7)
    const logoImg = document.querySelector('.logo-svg');
    if(logoImg) logoImg.classList.add('rotating-logo');

    updatePrices();
    setInterval(updatePrices, 30000);
    updateSwapUI();
    
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
            new QRCode(document.getElementById("qrcode"), { text: currentAddr, width: 140, height: 140 });
        } 
    });
}

window.showTab = function(id, el) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('scr_'+id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
}

window.showAssetMenu = function(id) {
    const a = assets.find(x => x.id === id);
    document.getElementById('menu_title').innerHTML = `
        <div class="modal-header-info">
            <img src="${a.img}">
            <span>${a.name}</span>
        </div>`;
    
    document.querySelectorAll('.cur_asset').forEach(e => {
        e.innerHTML = `<img src="${a.img}" style="width:18px; border-radius:50%; vertical-align:middle; margin-right:8px;"> ${a.id}`;
    });
    
    switchModalView('menu');
    document.getElementById('universal_modal').style.display = 'flex';
}

window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; }

window.switchModalView = function(v) {
    document.querySelectorAll('.modal-view').forEach(x => x.classList.remove('active'));
    document.getElementById('view_' + v).classList.add('active');
}

window.copyAddr = function() {
    const addr = document.getElementById('full_addr').innerText;
    if(addr === "Disconnected") return;
    navigator.clipboard.writeText(addr).then(() => tg.showAlert("Copied!"));
}

window.openCoinPicker = function(type) {
    activePicker = type;
    const list = document.getElementById('coin_options_list');
    list.innerHTML = "";
    assets.forEach(a => {
        list.innerHTML += `
            <div class="coin-option" onclick="selectCoin('${a.id}')">
                <img src="${a.img}">
                <div class="coin-ticker">${a.id}</div>
            </div>`;
    });
    document.getElementById('picker_modal').style.display = 'flex';
}

window.selectCoin = function(id) {
    if(activePicker === 'from') swapFrom = id; else swapTo = id;
    updateSwapUI();
    closeModal('picker_modal');
}

function updateSwapUI() {
    const from = assets.find(x => x.id === swapFrom);
    const to = assets.find(x => x.id === swapTo);
    document.getElementById('sw_from_img').src = from.img;
    document.getElementById('sw_from_txt').innerText = swapFrom;
    document.getElementById('sw_to_img').src = to.img;
    document.getElementById('sw_to_txt').innerText = swapTo;
    calculateSwap();
}

window.calculateSwap = function() {
    const val = document.getElementById('sw_val').value;
    const res = document.getElementById('sw_res');
    const aFrom = assets.find(x => x.id === swapFrom);
    const aTo = assets.find(x => x.id === swapTo);
    if(val > 0 && aFrom.price > 0 && aTo.price > 0) {
        res.value = ((val * aFrom.price) / aTo.price).toFixed(6);
    } else { res.value = ""; }
}

window.swapReverse = function() {
    const t = swapFrom; swapFrom = swapTo; swapTo = t;
    updateSwapUI();
}

window.onload = init;
