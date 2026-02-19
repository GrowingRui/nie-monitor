const TELEGRAM_TOKEN = "你的BOT_TOKEN"; // 记得替换
const TELEGRAM_CHAT_ID = "你的CHAT_ID"; // 记得替换

// 发送 Telegram 消息的函数
async function sendTelegramMessage(text) {
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
        console.log("Telegram 消息已发出");
    } catch (e) {
        console.error("Telegram 发送失败:", e);
    }
}

// 确保闹钟存在
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("checkCita", { periodInMinutes: 1 });
    console.log("闹钟已创建：每分钟检查一次");
});

// 监听闹钟：触发页面刷新
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "checkCita") {
        const tabs = await chrome.tabs.query({
            url: "https://icp.administracionelectronica.gob.es/icpplus/*"
        });

        if (tabs.length > 0) {
            console.log("正在通知页面刷新并检查...");
            // 发送指令让 Content.js 执行“无弹窗刷新”
            chrome.tabs.sendMessage(tabs[0].id, { action: "refresh_and_check" });
        }
    }
});

// 接收来自 Content.js 的检测结果
chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.action === "status_report") {
        const { lastStatus } = await chrome.storage.local.get("lastStatus");

        if (msg.status === "available" && lastStatus !== "available") {
            // 1. 发送系统通知
            chrome.notifications.create({
                type: "basic",
                iconUrl: "icon48.png",
                title: "🔥 发现预约空位！",
                message: "西班牙预约系统有号了，请立即处理！",
                priority: 2
            });

            // 2. 发送 Telegram 通知
            await sendTelegramMessage("🔔 *NIE 预约提醒*\n检测到有号！请立即查看浏览器页面！");
        }

        // 更新状态，防止重复报警
        await chrome.storage.local.set({ lastStatus: msg.status });
    }
});