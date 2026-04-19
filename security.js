/** * Grok Avto Trade - Security Module v1.0
 * Защита от анализа, копирования и отладки
 */

(function() {
    // 1. Анти-дебаггер: вызывает циклическую остановку кода, если открыта консоль
    const block = () => {
        setInterval(() => {
            (function() { return false; constructor('debugger')(); })();
        }, 100);
    };
    try { block(); } catch (e) {}

    // 2. Блокировка контекстного меню (правой кнопки)
    document.addEventListener('contextmenu', e => e.preventDefault());

    // 3. Запрет выделения и копирования
    document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('copy', e => e.preventDefault());

    // 4. Блокировка горячих клавиш (F12, Ctrl+U, Ctrl+Shift+I и т.д.)
    document.addEventListener('keydown', e => {
        if (
            e.keyCode === 123 || // F12
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || // Ctrl+Shift+I/J
            (e.ctrlKey && e.keyCode === 85) // Ctrl+U (Исходный код)
        ) {
            e.preventDefault();
            return false;
        }
    });

    // 5. Защита от вставки в iFrame (против Clickjacking)
    if (window.top !== window.self) { 
        window.top.location = window.self.location; 
    }
    
    console.log("%cStop!", "color: red; font-size: 40px; font-weight: bold;");
    console.log("%cThis is a developer feature. If someone told you to copy-paste something here, it is a scam.", "font-size: 16px;");
})();
