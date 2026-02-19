/**
 * NIE-Monitor-V2 | content.js
 * 负责：页面解析、避开刷新弹窗、Session状态上报
 */

(function () {
    // 1. 监听来自 background.js 的刷新指令
    // 使用这种方式可以绕过浏览器的 "Confirm Form Resubmission" 弹窗
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "execute_refresh") {
            console.log("🔄 接收到刷新指令，执行干净跳转以规避弹窗...");
            // 使用 replace 或赋值 href 会发起 GET 请求，通常能规避 POST 提交警告
            window.location.href = window.location.href;
        }
    });

    // 2. 执行页面内容扫描逻辑
    chrome.storage.local.get(["isRunning"], function (result) {
        // 如果监控未启动，则不执行任何逻辑
        if (!result.isRunning) return;

        console.log("🔍 NIE Monitor: 正在扫描预约状态...");

        const bodyText = document.body.innerText;
        const text = bodyText.toLowerCase();

        // --- A. 检查 Session 是否过期 ---
        const sessionExpiredPatterns = [
            "su sesión ha caducado",
            "sesion ha caducado",
            "volver a intentar",
            "error de sesión"
        ];

        if (sessionExpiredPatterns.some(p => text.includes(p))) {
            console.error("❌ Session 已失效");
            chrome.runtime.sendMessage({ action: "session_expired" });
            return;
        }

        // --- B. 检查是否有号 (无号特征) ---
        const noCitaPatterns = [
            "no hay citas disponibles",
            "en este momento no hay citas",
            "no existen citas",
            "no hay disponibilidad"
        ];

        let noCitaFound = noCitaPatterns.some(p => text.includes(p));

        // --- C. 结果判定与上报 ---
        if (noCitaFound) {
            console.log("😴 状态：当前依然没有空位。");
            chrome.runtime.sendMessage({
                action: "status_update",
                status: "none"
            });
        } else if (
            // 只要没发现“无号”关键词，且页面出现了核心交互词，就认为有号
            text.includes("seleccionar") ||
            text.includes("oficina") ||
            text.includes("pasaporte") ||
            text.includes("cita para")
        ) {
            console.log("🌟 状态：！！！发现空位！！！");
            chrome.runtime.sendMessage({
                action: "status_update",
                status: "available"
            });
        } else {
            // 如果既没有“无号”词，也没识别到“有号”特征，可能在初始页或加载中
            console.log("⏳ 未能识别页面状态，等待下次刷新...");
        }
    });
})();