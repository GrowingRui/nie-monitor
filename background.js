// 启动监控
async function startMonitoring() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return;

    const tabId = tabs[0].id;
    await chrome.storage.local.set({
        isRunning: true,
        monitoringTabId: tabId,
        lastStatus: "unknown"
    });

    console.log("✅ 监控开始，目标标签页 ID:", tabId);
    scheduleNextCheck();
}

// 停止监控
async function stopMonitoring() {
    await chrome.storage.local.set({ isRunning: false, monitoringTabId: null });
    chrome.alarms.clear("nieCheck");
    console.log("🛑 监控已手动停止");
}

// 设置下一次检查闹钟
async function scheduleNextCheck() {
    const { isRunning } = await chrome.storage.local.get("isRunning");
    if (!isRunning) return;

    // 正常的 1 到 1.5 分钟随机波动
    const delay = 1.0 + Math.random() * 0.5;
    chrome.alarms.create("nieCheck", { delayInMinutes: delay });
    console.log(`⏰ 闹钟已设定：将在 ${Math.round(delay * 60)} 秒后刷新页面`);
}

// 闹钟触发监听
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== "nieCheck") return;

    const { isRunning, monitoringTabId } = await chrome.storage.local.get(["isRunning", "monitoringTabId"]);

    if (isRunning && monitoringTabId) {
        try {
            console.log("🔄 正在刷新页面检测...");
            await chrome.tabs.reload(monitoringTabId);
            scheduleNextCheck();
        } catch (e) {
            console.error("❌ 刷新失败，页面可能已被关闭:", e);
            stopMonitoring();
        }
    }
});

// 消息中心
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "start") startMonitoring();
    else if (msg.action === "stop") stopMonitoring();
    else if (msg.action === "status_update") handleStatusUpdate(msg.status);
    else if (msg.action === "session_expired") handleSessionExpired();
});

async function handleStatusUpdate(newStatus) {
    const { lastStatus } = await chrome.storage.local.get("lastStatus");

    if (newStatus === "available" && lastStatus !== "available") {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icon48.png",
            title: "🔥 发现预约空位！",
            message: "系统状态已变化，快去查看！",
            priority: 2
        });
    }
    await chrome.storage.local.set({ lastStatus: newStatus });
}

async function handleSessionExpired() {
    await stopMonitoring();
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "⚠ 会话过期",
        message: "监控已停止。请重新登录进入结果页后点开始。"
    });
}