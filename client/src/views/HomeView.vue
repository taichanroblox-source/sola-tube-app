<template>
  <div>
    <!-- カテゴリ切り替えボタン -->
    <nav class="category-nav">
      <button
        v-for="cat in categories"
        :key="cat.key"
        :class="{ active: selectedCategory === cat.key }"
        @click="selectedCategory = cat.key"
      >
        {{ cat.label }}
      </button>
    </nav>

    <main>
      <div v-if="loading" class="loading" role="status">動画を読み込み中...（最大12秒）</div>
      <div v-if="error" class="error" role="alert">{{ error }} <button type="button" @click="fetchTrendData">再読み込み</button></div>
      <div v-if="!loading && !error && !selectedVideos.length" class="loading">このカテゴリには表示できる動画がありません。</div>

      <VideoList
        v-if="!loading && !error && selectedVideos.length"
        :videos="selectedVideos"
        :title="currentCategoryLabel"
      />
    </main>
    <footer class="footer">
      <p style="margin-block-start: 1px; color: var(--text-primary);">SOLA TUBE</p>
      <p style="color: var(--text-secondary);">SOLAの動画サービス</p>
      <div style="color: var(--text-secondary);">バージョン1.5.4</div>
    </footer>
  </div>
</template>

<script>
import VideoList from "@/components/VideoList.vue";

export default {
  components: { VideoList },
  data() {
    return {
      trend: {
        trending: [],
        music: [],
        gaming: [],
      },
      loading: false,
      error: null,
      selectedCategory: "trending",
      categories: [
        { key: "trending", label: "急上昇" },
        { key: "gaming", label: "ゲーム" },
        { key: "music", label: "音楽" },
      ],
    };
  },
  computed: {
    selectedVideos() {
      return this.trend[this.selectedCategory] || [];
    },
    currentCategoryLabel() {
      const found = this.categories.find(
        (c) => c.key === this.selectedCategory
      );
      return found ? found.label : "";
    },
  },
  created() {
    document.title = "SOLA TUBE - ホーム";
    this.fetchTrendData();
  },
  methods: {
    async fetchTrendData() {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch("/api/trend", { signal: AbortSignal.timeout(12000), cache: "no-store" });
        if (!res.ok) throw new Error("データ取得失敗");
        const data = await res.json();
        if (!data || typeof data !== "object") throw new Error("動画データの形式が正しくありません");
        this.trend = data;
      } catch (e) {
        this.error = e.name === "TimeoutError" || e.name === "AbortError" ? "通信がタイムアウトしました。時間をおいて再読み込みしてください。" : `動画を読み込めませんでした: ${e.message}`;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.Accesscount {
  font-size: 1rem;
  color: var(--text-primary);
}
.category-nav {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  justify-content: center;
  background-color: var(--bg-primary);
  transition: background-color 0.3s ease;
}
.category-nav button {
  padding: 0.5rem 1rem;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 4px;
  font-weight: bold;
  transition: background-color 0.3s ease, color 0.3s ease;
}
.category-nav button:hover {
  background-color: var(--hover-bg);
}
.category-nav button.active {
  background-color: var(--accent-color);
  color: var(--on-accent);
}
.error {
  color: var(--accent-weak);
  padding: 1rem;
}
.loading {
  padding: 1rem;
  text-align: center;
  color: var(--text-primary);
}
main {
  padding: 1rem;
  background-color: var(--bg-primary);
  transition: background-color 0.3s ease;
}
.footer {
  margin-top: 0px;
  padding: 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.footer a {
  color: var(--accent-color);
  text-decoration: none;
  margin: 0 0.5rem;
  transition: color 0.2s ease;
}

.footer a:hover {
  text-decoration: underline;
}
</style>
