const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const fs = require('fs');

// Telegram Bot Token (BotFather se mila hoga)
const BOT_TOKEN = '8663323106:AAHlvtqTE5bxHLG8rbkebJHF0nkHozdeTU8';
const bot = new Telegraf(BOT_TOKEN);

// WhatsApp Bot ki PID store karne ke liye
let whatsappProcess = null;

// Pairing code store karne ke liye
let pendingPairingCode = null;

// Command: /start
bot.command('start', (ctx) => {
    ctx.reply(`
🤖 *WhatsApp Bot Controller*
━━━━━━━━━━━━━━━━━━━
📱 *Commands:*
/connect <number> - Connect WhatsApp number
/status - Check bot status
/restart - Restart WhatsApp bot
/logs - View bot logs
/pairing <code> - Enter pairing code
    `, { parse_mode: 'Markdown' });
});

// Command: /connect
bot.command('connect', (ctx) => {
    const number = ctx.message.text.split(' ')[1];
    
    if (!number) {
        ctx.reply('❌ Please provide number: /connect 923001234567');
        return;
    }
    
    ctx.reply(`🔄 Connecting WhatsApp to ${number}...`);
    
    // WhatsApp bot ko start karein with pairing code
    if (whatsappProcess) {
        whatsappProcess.kill();
    }
    
    // Number ko env mein set karein
    process.env.PAIRING_NUMBER = number;
    
    // WhatsApp bot start karein
    whatsappProcess = exec('node index.js', (error, stdout, stderr) => {
        if (error) {
            ctx.reply(`❌ Error: ${error.message}`);
        }
        if (stderr) {
            console.log(stderr);
        }
        
        // Logs mein pairing code detect karein
        if (stdout && stdout.includes('Your Pairing Code')) {
            const match = stdout.match(/Your Pairing Code : (\d+)/);
            if (match) {
                pendingPairingCode = match[1];
                ctx.reply(`📱 *Pairing Code Generated!*\n\nCode: \`${pendingPairingCode}\`\n\nUse /pairing ${pendingPairingCode} to confirm`, { parse_mode: 'Markdown' });
            }
        }
    });
    
    // Output logs capture
    whatsappProcess.stdout.on('data', (data) => {
        console.log(data);
        
        // Detect pairing code automatically
        if (data.includes('Your Pairing Code')) {
            const match = data.match(/Your Pairing Code : (\d+)/);
            if (match) {
                pendingPairingCode = match[1];
                ctx.reply(`✅ *Pairing Code Ready!*\n\nCode: \`${pendingPairingCode}\`\n\nOpen WhatsApp and enter this code on linked device screen.`, { parse_mode: 'Markdown' });
            }
        }
        
        if (data.includes('CONNECTED')) {
            ctx.reply('✅ *WhatsApp Bot Connected Successfully!* 🎉');
        }
    });
    
    whatsappProcess.stderr.on('data', (data) => {
        console.error(data);
    });
});

// Command: /pairing - Manually enter pairing code
bot.command('pairing', (ctx) => {
    const code = ctx.message.text.split(' ')[1];
    
    if (!code) {
        ctx.reply('❌ Please provide code: /pairing 12345678');
        return;
    }
    
    ctx.reply(`🔐 Sending pairing code: ${code}`);
    
    // Pairing code send karne ka logic
    // Note: WhatsApp bot mein automatic detection hai, 
    // yeh manual confirmation ke liye hai
    pendingPairingCode = code;
    ctx.reply('✅ Code saved! WhatsApp will connect automatically.');
});

// Command: /status
bot.command('status', (ctx) => {
    const status = whatsappProcess ? '🟢 Running' : '🔴 Stopped';
    const pairingStatus = pendingPairingCode ? `📱 Pairing Code: ${pendingPairingCode}` : '⏳ No active pairing';
    
    ctx.reply(`
🤖 *Bot Status*
━━━━━━━━━━━━━━━━━━━
Status: ${status}
${pairingStatus}
    `, { parse_mode: 'Markdown' });
});

// Command: /restart
bot.command('restart', (ctx) => {
    ctx.reply('🔄 Restarting WhatsApp bot...');
    
    if (whatsappProcess) {
        whatsappProcess.kill();
        setTimeout(() => {
            whatsappProcess = exec('node index.js');
            ctx.reply('✅ Bot restarted!');
        }, 2000);
    } else {
        whatsappProcess = exec('node index.js');
        ctx.reply('✅ Bot started!');
    }
});

// Command: /logs
bot.command('logs', (ctx) => {
    ctx.reply('📋 Check Railway logs for detailed output');
});

// Start Telegram bot
bot.launch();
console.log('🤖 Telegram Bot Started!');
