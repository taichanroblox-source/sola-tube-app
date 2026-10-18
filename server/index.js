import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import fs from 'fs';


// --- 不要なログを抑制 ---
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;
const originalInfo = console.info;
const originalDebug = console.debug;
const originalTrace = console.trace;

const filterYoutubeJsLogs = (...args) => {
  // ログ制御ファイルを確認（ON のときのみ YOUTUBEJS 関連ログを表示）
  try {
    const mode = fs.readFileSync(path.join(process.cwd(), 'log.txt'), 'utf8').trim();
    if (mode === 'ON') {
      return false; // フィルタしない（ログをそのまま出す）
    }
  } catch (e) {
    // ファイルがない・読み込みエラーならデフォルトは OFF とみなす（抑制する）
  }
  for (const a of args) {
    if (typeof a === 'string' && a.includes('[YOUTUBEJS]')) return true;
    if (typeof a === 'string' && (a.includes('Unable to find matching run') || a.includes('ParsingError'))) return true;
    if (typeof a === 'object' && a !== null) {
      if (a.info && a.version && a.date) return true; // ParsingError オブジェクト
      if (a.attachment_run && a.input_data) return true; // attachment run オブジェクト
    }
  }
  // 文字列結合して念のためチェック
  const message = args.join(' ');
  return message.includes('[YOUTUBEJS]') || message.includes('Unable to find matching run') || message.includes('ParsingError');
};

console.warn = (...args) => { if (!filterYoutubeJsLogs(...args)) originalWarn(...args); };
console.error = (...args) => { if (!filterYoutubeJsLogs(...args)) originalError(...args); };
console.log = (...args) => { if (!filterYoutubeJsLogs(...args)) originalLog(...args); };
console.info = (...args) => { if (!filterYoutubeJsLogs(...args)) originalInfo(...args); };
console.debug = (...args) => { if (!filterYoutubeJsLogs(...args)) originalDebug(...args); };
console.trace = (...args) => { if (!filterYoutubeJsLogs(...args)) originalTrace(...args); };

// --- ESM での __dirname 取得 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- 通常ミドルウェア ---
app.use(cookieParser());
app.use(express.json());

// --- ルーターインポート ---
import suggestRouter from "./routes/suggest.js";
import searchRouter from "./routes/search2.js";
import videoRouter from "./routes/videoinfo.js";
import commentRoute from "./routes/comment.js";
import channelRoute from "./routes/channel.js";
import streamUrlRouter from "./routes/stream-url.js";
import fallbackRoute from "./routes/fallback.js";
import playlistRouter from "./routes/playlist.js";

// --- APIルーティング ---
app.use("/api/search", searchRouter);
app.use("/api/suggest", suggestRouter);
app.use("/api/video", videoRouter);
app.use("/api/comments", commentRoute);
app.use("/api/channel", channelRoute);
app.use("/api/stream", streamUrlRouter);
app.use("/api/playlist", playlistRouter);
app.use("/api", fallbackRoute); 

app.get("/api/trend", async (req, res) => {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/siawaseok3/wakame/refs/heads/master/trend.json"
    );
    if (!response.ok) throw new Error("GitHubからの取得に失敗");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || "トレンドデータ取得失敗" });
  }
});

// --- /exec リダイレクトルート ---
app.get('/exec', (req, res) => {
  const q = req.query;

  if (q.video)   return res.redirect(`/api/video/${encodeURIComponent(q.video)}`);
  if (q.stream)  return res.redirect(`/api/stream/${encodeURIComponent(q.stream)}`);
  if (q.stream2) return res.redirect(`/api/stream/${encodeURIComponent(q.stream2)}/type2`);
  if (q.channel) return res.redirect(`/api/channel/${encodeURIComponent(q.channel)}`);
  if (q.q)       return res.redirect(`/api/search?q=${encodeURIComponent(q.q)}`);
  if ('trend' in q) return res.redirect(`/api/trend`);
  if (q.playlist) return res.redirect(`/api/playlist/${encodeURIComponent(q.playlist)}`);
  if (q.comments) return res.redirect(`/api/comments/${encodeURIComponent(q.comments)}`);

  return res.status(400).send('Invalid parameters.');
});

// --- 静的ファイル（Vueビルド済み） ---
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// --- HTTP サーバー起動 ---
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`✅ Node.js Server running on port ${PORT}`);
});
