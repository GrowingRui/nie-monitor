async function startMonitoring() {
    console.log("🚀 正在尝试启动监控...");
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return;

    const tabId = tabs[0].id;
    await chrome.storage.local.set({
        isRunning: true,
        monitoringTabId: tabId,
        lastStatus: "unknown"
    });

    console.log("✅ 监控已激活，Tab ID:", tabId);
    scheduleNextCheck();
}

async function stopMonitoring() {
    console.log("🛑 停止监控");
    await chrome.storage.local.set({ isRunning: false, monitoringTabId: null });
    chrome.alarms.clear("nieCheck");
}

async function scheduleNextCheck() {
    const { isRunning } = await chrome.storage.local.get("isRunning");
    if (!isRunning) return;

    const delay = 1.5 + Math.random() * 1.5;
    chrome.alarms.create("nieCheck", { delayInMinutes: delay });
    console.log(`⏰ 已排期下一次刷新，将在 ${delay.toFixed(2)} 分钟后执行`);
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== "nieCheck") return;
    const { isRunning, monitoringTabId } = await chrome.storage.local.get(["isRunning", "monitoringTabId"]);

    if (isRunning && monitoringTabId) {
        console.log("🔄 定时器触发：正在刷新页面...");
        chrome.tabs.reload(monitoringTabId);
        scheduleNextCheck();
    }
});

chrome.runtime.onMessage.addListener((msg) => {
    console.log("📩 收到消息:", msg.action, msg.status || "");
    if (msg.action === "start") startMonitoring();
    else if (msg.action === "stop") stopMonitoring();
    else if (msg.action === "status_update") handleStatusUpdate(msg.status);
    else if (msg.action === "session_expired") handleSessionExpired();
});

async function handleStatusUpdate(newStatus) {
    if (newStatus === "available") {
        console.log("🎉 【重要】检测到空位！正在发送通知...");
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icon48.png",
            title: "🔥 发现预约空位！",
            message: "页面状态已变化，快去抢号！"
        });
    }
}

async function handleSessionExpired() {
    console.warn("⚠️ 会话已过期，监控停止");
    await stopMonitoring();
}