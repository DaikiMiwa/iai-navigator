# IAI v1.0.0

[English below]

## 日本語リリースノート

### 🚀 主な機能
- **Vim風リンクヒント**: `f` キーでリンクやボタンの上に文字タグを表示し、キー入力で即座にクリックできます。
  - テキストを覆い隠さないための重なり防止配置アルゴリズムを搭載。
  - Shadow DOM内の要素も正しく検出し位置計算を行います。
- **Spotlight風コマンドパレット**: `o` キーで起動する、美しいガラスモーフィズムの検索バー。
  - 開いているタブ、ブックマーク、履歴、拡張機能コマンドを日英両言語で横断検索できます。
- **高度なカスタマイズ性**: 設定画面でのリアルタイムプレビュー、表示言語切り替え（日英）、ヒントキーの変更、スクロール設定やディム演出の微調整。
- **徹底したプライバシー保護**: トラッカーや通信がない完全なローカルファースト設計。
- **日本語IMEへの配慮**: 文字入力・確定時（Enterキー押下等）に誤ってショートカットキーやコマンドが暴発するのを防ぐ安全ルーティング。

---

## English Release Notes

### 🚀 Key Features
- **Vim-style Link Hints**: Press `f` to overlay character tags on links, buttons, and inputs, and click them instantly.
  - Staggered, non-overlapping label placement algorithm ensures text remains readable.
  - Full support for elements inside Shadow DOMs, fixing coordinate offsets.
- **Spotlight-style Command Palette**: Press `o` to invoke a modern, glassmorphic search bar.
  - Search across active tabs, bookmarks, history, and extension shortcuts with bilingual support (EN/JA).
- **Rich Customization**: Live settings previewer, customizable hint keys, custom UI language toggle, scroll metrics, and dim transition speeds.
- **Local-First Privacy**: Zero analytics, trackers, telemetry, or remote server communications. All data stays on your device.
- **Japanese IME Safety**: Smart event routing prevents shortcut triggers from swallowing your active composition and confirmation keys.
