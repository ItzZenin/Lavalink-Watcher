require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { Shoukaku, Connectors } = require("shoukaku");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers
  ]
});
const shoukaku = new Shoukaku(
  new Connectors.DiscordJS(client),
  [
    {
      name: "Main",
      url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`,
      auth: process.env.LAVALINK_PASSWORD,
      secure: process.env.LAVALINK_SECURE === "true"
    }
  ]
);

let lavalinkMessage = null;

async function updateLavalinkStats() {
  const channel = await client.channels.fetch(process.env.LAVALINK_CHANNEL).catch(() => null);
  if (!channel) return;

  const node = shoukaku.nodes.get("Main");
  let embed;

  if (!node || !node.stats) {
    embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setDescription("Lavalink Died")
      .setTimestamp();
  } else {
    const stats = node.stats;

    const usedRam = (stats.memory.used / 1024 / 1024).toFixed(2);
    const totalRam = (stats.memory.reservable / 1024 / 1024).toFixed(2);
    const ramUsage = ((stats.memory.used / stats.memory.reservable) * 100).toFixed(2);

    embed = new EmbedBuilder()
      .setColor(0x257ade)
      .setTitle("Lavalink Stats")
      .setDescription(
        `> **Status:** <:online:1432315464226308188> Online\n` +
        `> **Players:** ${stats.players}\n` +
        `> **Playing Players:** ${stats.playingPlayers}\n` +
        `> **CPU Load:** ${(stats.cpu.systemLoad * 100).toFixed(2)}%\n` +
        `> **RAM:** ${usedRam}MB / ${totalRam}MB\n` +
        `> **RAM Usage:** ${ramUsage}%`
      )
      .setTimestamp();
  }

  if (lavalinkMessage) {
    return lavalinkMessage.edit({ embeds: [embed] }).catch(() => {});
  }

  if (process.env.LAVALINK_MSG_ID) {
    lavalinkMessage = await channel.messages
      .fetch(process.env.LAVALINK_MSG_ID)
      .catch(() => null);

    if (lavalinkMessage) {
      return lavalinkMessage.edit({ embeds: [embed] });
    }
  }

  lavalinkMessage = await channel.send({ embeds: [embed] });
}


client.once("ready", async () => {
  console.log(`Hello World, I am ${client.user.username}.`);

  await updateLavalinkStats();
  setInterval(updateLavalinkStats, 60_000);
});

client.login(process.env.TOKEN);
