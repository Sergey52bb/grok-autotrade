// Блокировка правой кнопки мыши
document.addEventListener('contextmenu', e => e.preventDefault());

// Блокировка горячих клавиш разработчика
document.onkeydown = function(e) {
    if (e.keyCode == 123 || 
        (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) || 
        (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) || 
        (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
        return false;
    }
};

// Простая защита от копирования текста
document.addEventListener('copy', (e) => {
    e.preventDefault();
    return false;
});
