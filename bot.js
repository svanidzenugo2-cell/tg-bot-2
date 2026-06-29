```js
const path = require("path");
const express = require("express");
const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN =
  "8918769880:AAEI-Erl_NvarDFxtxVSQd_UpMHWHUWMFbs";

const WEB_APP_URL = process.env.WEB_APP_URL;
const PORT = Number(process.env.PORT) || 3000;

if (!BOT_TOKEN) {
  console.error("Missing Telegram bot token.");
  process.exit(1);
}

if (!WEB_APP_URL) {
  console.error("Missing WEB_APP_URL environment variable.");
  process.exit(1);
}

let parsedUrl;

try {
  parsedUrl = new URL(WEB_APP_URL);
} catch {
  console.error("WEB_APP_URL must be a valid URL.");
  process.exit(1);
}

if (parsedUrl.protocol !== "https:") {
  console.error("WEB_APP_URL must use HTTPS for Telegram Web Apps.");
  process.exit(1);
}

const app = express();
const bot = new Telegraf(BOT_TOKEN);

const publicDirectory = path.join(__dirname, "public");

app.disable("x-powered-by");
app.use(express.json());
app.use(express.static(publicDirectory));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDirectory, "app.html"));
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    bot: "running",
  });
});

function openAppKeyboard() {
  return Markup.inlineKeyboard([
    Markup.button.webApp("OPEN APP", WEB_APP_URL),
  ]);
}

bot.start(async (ctx) => {
  await ctx.reply(
    "Welcome! Tap the button below to open the app.",
    openAppKeyboard()
  );
});

bot.command("app", async (ctx) => {
  await ctx.reply(
    "Open the app:",
    openAppKeyboard()
  );
});

bot.catch((error, ctx) => {
  console.error(
    `Telegram bot error for update ${ctx.update.update_id}:`,
    error
  );
});

async function start() {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Web server listening on port ${PORT}`);
  });

  try {
    await bot.telegram.setChatMenuButton({
      menu_button: {
        type: "web_app",
        text: "OPEN APP",
        web_app: {
          url: WEB_APP_URL,
        },
      },
    });

    console.log("Telegram menu button configured.");
  } catch (error) {
    console.warn(
      "Could not configure the Telegram menu button:",
      error.message
    );
  }

  await bot.launch({
    dropPendingUpdates: true,
  });

  console.log("Telegram bot started.");
}

start().catch((error) => {
  console.error("Failed to start the application:", error);
  process.exit(1);
});

const shutdown = (signal) => {
  console.log(`${signal} received. Stopping bot...`);
  bot.stop(signal);
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
```
