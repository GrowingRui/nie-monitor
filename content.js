(function () {
    chrome.storage.local.get(["isRunning"], function (result) {
        if (!result.isRunning) return;

        console.log("🔍 NIE 助手正在扫描页面内容...");
        const text = document.body.innerText.toLowerCase();

        if (text.includes("sesión ha caducado")) {
            console.error("❌ Session Expired!");
            chrome.runtime.sendMessage({ action: "session_expired" });
            return;
        }

        const noCitaPatterns = ["no hay citas disponibles", "no existen citas", "no hay disponibilidad"];
        let noCitaFound = noCitaPatterns.some(p => text.includes(p));

        if (noCitaFound) {
            console.log("😴 状态：依然没号。");
            chrome.runtime.sendMessage({ action: "status_update", status: "none" });
        } else if (text.includes("seleccionar") || text.includes("oficina")) {
            console.log("🌟 状态：可能有号了！！");
            chrome.runtime.sendMessage({ action: "status_update", status: "available" });
        }
    });
})();