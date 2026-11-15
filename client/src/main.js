import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// エラーを隠さずブラウザの開発者ツールで確認できるようにする
const app = createApp(App);
app.config.errorHandler = (err, instance, info) => {
  console.error("[SOLA TUBE] Vue error:", info, err);
};
app.use(router).mount("#app");
