const TelegramBot = require('node-telegram-bot-api');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

// Telegram bot token එක ඇතුළත් කරන්න
const token = '7836254978:AAH5hCYoJ2mi7B-6TQXR0N92tdNQPHSBdYU';
const bot = new TelegramBot(token, { polling: true });

// Bot start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome! Send me a YouTube link to download video or audio.');
});

// YouTube link handle කිරීම
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const url = msg.text;

    if (ytdl.validateURL(url)) {
        try {
            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title;

            // Video download option
            bot.sendMessage(chatId, `Downloading video: ${title}...`);
            const videoStream = ytdl(url, { quality: 'highestvideo' });
            const videoPath = `./${title}.mp4`;
            videoStream.pipe(fs.createWriteStream(videoPath))
                .on('finish', () => {
                    bot.sendVideo(chatId, videoPath)
                        .then(() => fs.unlinkSync(videoPath))
                        .catch(err => console.error(err));
                });

            // Audio download option
            bot.sendMessage(chatId, `Downloading audio: ${title}...`);
            const audioPath = `./${title}.mp3`;
            ffmpeg(ytdl(url, { quality: 'highestaudio' }))
                .audioBitrate(128)
                .save(audioPath)
                .on('end', () => {
                    bot.sendAudio(chatId, audioPath)
                        .then(() => fs.unlinkSync(audioPath))
                        .catch(err => console.error(err));
                });
        } catch (error) {
            bot.sendMessage(chatId, 'Error downloading the video/audio. Please try again.');
            console.error(error);
        }
    } else {
        bot.sendMessage(chatId, 'Please send a valid YouTube link.');
    }
});
