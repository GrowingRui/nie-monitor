document.getElementById('start').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "START_MONITOR" });
    document.getElementById('stateText').innerText = "✅ 监控运行中...";
    alert("监控已启动！请保持预约结果页面不要关闭。");
});

document.getElementById('stop').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "STOP_MONITOR" });
    document.getElementById('stateText').innerText = "🛑 监控已停止";
});

// 初始化显示状态
chrome.storage.local.get(["isRunning"], (res) => {
    if (res.isRunning) {
        document.getElementById('stateText').innerText = "✅ 监控运行中...";
    }
});