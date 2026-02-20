/**
 * NIE-Monitor-V2 | content.js
 * 负责：页面解析、避开刷新弹窗、Session状态上报
 */

(function () {
    console.log("LOG: [Content] 脚本已在页面注入");

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "DO_REFRESH") {
            console.log("LOG: [Content] 收到刷新指令，开始寻找交互按钮...");

            const btnVolver = document.querySelector('input[value*="Volver"], input[value*="VOLVER"], #btnVolver');
            const btnSiguiente = document.querySelector('input[value*="Siguiente"], input[value*="Aceptar"], #btnSiguiente');

            if (btnVolver) {
                console.log("LOG: [Action] 点击 Volver 避开表单重复提交弹窗");
                btnVolver.click();
            } else if (btnSiguiente) {
                console.log("LOG: [Action] 点击 Siguiente 进行下一步检查");
                btnSiguiente.click();
            } else {
                console.warn("LOG: [Action] 未找到按钮，执行强制刷新");
                window.location.replace(window.location.href);
            }
        }
    });

    function scanPage() {
        chrome.storage.local.get(["isRunning"], function (res) {
            if (!res.isRunning) return;

            const text = document.body.innerText.toLowerCase();
            console.log("LOG: [Content] 正在分析页面文本...");

            if (text.includes("sesión ha caducado") || text.includes("sesion ha caducado")) {
                chrome.runtime.sendMessage({ action: "REPORT_STATUS", status: "expired" });
                return;
            }

            const noCitaPatterns = ["no hay citas disponibles", "no existen citas", "no hay disponibilidad"];
            let isNoCita = noCitaPatterns.some(p => text.includes(p));

            if (isNoCita) {
                chrome.runtime.sendMessage({ action: "REPORT_STATUS", status: "none" });
            } else if (text.includes("seleccionar") || text.includes("oficina") || text.includes("pasaporte")) {
                chrome.runtime.sendMessage({ action: "REPORT_STATUS", status: "available" });
            }
        });
    }

    // 延迟 2 秒扫描，等待页面渲染
    setTimeout(scanPage, 2000);
})();