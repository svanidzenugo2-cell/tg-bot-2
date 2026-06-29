const path = require("path");
const fs = require("fs");
const express = require("express");
const { Telegraf, Markup } = require("telegraf");

// Temporary test token
const BOT_TOKEN = "8918769880:AAEI-Erl_NvarDFxtxVSQd_UpMHWHUWMFbs";

// Add your existing Mini App website URL in Railway Variables:
// WEB_APP_URL=https://your-existing-website.com
const WEB_APP_URL = process.env.WEB_APP_URL;

const PORT = Number(process.env.PORT) || 3000;
const START_IMAGE = path.join(__dirname, "image.jpg");

if (!WEB_APP_URL) {
  console.error("Missing WEB_APP_URL in Railway Variables.");
  process.exit(1);
}

const app = express();
const bot = new Telegraf(BOT_TOKEN);

// Railway only needs this small web server to keep the service healthy.
app.get("/", function (req, res) {
  res.status(200).send("Telegram bot is running.");
});

app.get("/health", function (req, res) {
  res.status(200).json({
    status: "ok",
    bot: "running"
  });
});

function appButton() {
  return Markup.inlineKeyboard([
    [Markup.button.webApp("🚀 OPEN APP", WEB_APP_URL)]
  ]);
}

async function sendStartMessage(ctx) {
  const caption =
    "🎁 Welcome!\n\n" +
    "Tap the button below to open the app and get started.";

  if (fs.existsSync(START_IMAGE)) {
    await ctx.replyWithPhoto(
      { source: START_IMAGE },
      {
        caption: caption,
        ...appButton()
      }
    );
    return;
  }

  console.warn("image.jpg was not found. Sending text-only start message.");

  await ctx.reply(
    caption,
    appButton()
  );
}

bot.start(async function (ctx) {
  await sendStartMessage(ctx);
});

bot.command("app", async function (ctx) {
  await sendStartMessage(ctx);
});

bot.catch(function (error, ctx) {
  const updateId =
    ctx && ctx.update && ctx.update.update_id
      ? ctx.update.update_id
      : "unknown";

  console.error(
    "Telegram bot error for update " + updateId + ":",
    error
  );
});

async function start() {
  app.listen(PORT, "0.0.0.0", function () {
    console.log("Web server listening on port " + PORT);
  });

  try {
    await bot.telegram.setChatMenuButton({
      menu_button: {
        type: "web_app",
        text: "OPEN APP",
        web_app: {
          url: WEB_APP_URL
        }
      }
    });

    console.log("Telegram menu button configured.");
  } catch (error) {
    console.warn(
      "Could not configure Telegram menu button:",
      error.message
    );
  }

  await bot.launch({
    dropPendingUpdates: true
  });

  console.log("Telegram bot started successfully.");
}

start().catch(function (error) {
  console.error("Failed to start the bot:", error);
  process.exit(1);
});

process.once("SIGINT", function () {
  bot.stop("SIGINT");
});

process.once("SIGTERM", function () {
  bot.stop("SIGTERM");
});
