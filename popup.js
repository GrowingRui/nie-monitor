document.getElementById("startBtn").addEventListener("click", async () => {
    // 获取当前标签页信息
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 校验是否在正确的政府域名下
    if (tab && tab.url.includes("administracionelectronica.gob.es")) {
        chrome.runtime.sendMessage({ action: "start" });
        window.close(); // 启动后关闭小窗
    } else {
        alert("错误：请先手动进入预约查询结果页面，再点击开始！");
    }
});

document.getElementById("stopBtn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "stop" });
    window.close();
});