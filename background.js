// 🛑 请务必在此处填入你的信息
const TELEGRAM_TOKEN = "";
const TELEGRAM_CHAT_ID = "";


// 发送 Telegram 消息
async function sendTelegram(text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: "Markdown"
            })
        });
        console.log("LOG: [Telegram] 通知已成功发送");
    } catch (e) {
        console.error("LOG: [Telegram] 发送失败:", e);
    }
}

/**
 * 调度下一次检查并记录时间 log
 * @param {number} minutes 间隔分钟数
 */
function scheduleNext(minutes) {
    chrome.alarms.create("checkCita", { delayInMinutes: minutes });
    const seconds = minutes * 60;
    const nextTime = new Date(Date.now() + minutes * 60000).toLocaleTimeString();

    // 满足你的需求：在 Log 里面提醒多长时间后更新
    console.log(`LOG: [Schedule] 监控运行中。将在 ${seconds} 秒后执行下一次自动更新，预计触发时间: ${nextTime}`);
}

// 闹钟监听
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "checkCita") {
        console.log(`LOG: [Alarm] ${new Date().toLocaleTimeString()} --- 定时任务触发 ---`);

        const tabs = await chrome.tabs.query({ url: "https://icp.administracionelectronica.gob.es/icpplus/*" });

        if (tabs.length > 0) {
            console.log(`LOG: [Tabs] 找到目标页面 (ID: ${tabs[0].id})，正在发送模拟点击指令...`);
            chrome.tabs.sendMessage(tabs[0].id, { action: "DO_REFRESH" });
        } else {
            console.warn("LOG: [Tabs] 警告：未找到预约结果页面。请确保浏览器已打开查询结果页。");
        }

        // 自动排期下一次检查
        scheduleNext(1);
    }
});

// 消息监听
chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.action === "REPORT_STATUS") {
        console.log(`LOG: [Status] 收到页面状态报告: ${msg.status}`);
        const { lastStatus } = await chrome.storage.local.get("lastStatus");

        if (msg.status === "available" && lastStatus !== "available") {
            console.log("LOG: [Alert] 🌟 检测到状态更新：发现名额！启动通知流程...");
            chrome.notifications.create({
                type: "basic",
                iconUrl: "icon48.png",
                title: "🔥 发现预约空位！",
                message: "系统检测到可用名额，请立即查看！"
            });
            await sendTelegram("🚀 *NIE 预约提醒*\n检测到页面状态变化，可能出号了！请立即抢号！");
        }
        await chrome.storage.local.set({ lastStatus: msg.status });
    }

    if (msg.action === "START_MONITOR") {
        console.log("LOG: [Control] 用户启动了监控服务");
        await chrome.storage.local.set({ isRunning: true });
        // 立即设定第一个 1 分钟后的闹钟
        scheduleNext(1);
    }

    if (msg.action === "STOP_MONITOR") {
        console.log("LOG: [Control] 用户停止了监控服务");
        chrome.alarms.clearAll();
        await chrome.storage.local.set({ isRunning: false });
    }
});