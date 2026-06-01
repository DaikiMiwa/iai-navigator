# Positioning

この product は Vimium clone ではなく、Safari-native な keyboard navigation app として position します。

## Core promise

Private command palette、link hints、tab search、bookmark/history search、site-aware shortcuts で Safari を keyboard から操作する。

## なぜ単なる Vim-like extension ではないのか

Safari users と Japanese users にとって意味のある領域で勝てます。

- Safari-native packaging: Safari Web Extension を Mac app に同梱し、App Store distribution と host app による setup、permissions、settings、support を提供する。
- Local-first privacy: analytics、telemetry、advertising SDK、remote logging、developer-controlled server for browsing data がない。
- Clear permission story: website、tab、bookmark、history access がなぜ必要かを説明し、どの site で動かすかをユーザーが制御できる。
- Japanese IME safety: composition と confirmation Enter 周りを明示的に test している。keyboard-heavy browser extension ではここが壊れやすい。
- Site-specific control: document editor や web app のような shortcut-heavy site で keyboard navigation を無効化または scope できる。
- Customizable shortcuts and hint appearance: native site shortcut との衝突を避け、ユーザー環境に合わせて hints を読みやすくできる。
- Safari-focused command palette: open tabs across windows、folder path つき bookmarks、recent history、local visits、extension commands、direct URLs、web search を1つの palette で扱う。
- Practical palette actions: URL copy、Markdown link copy、selected URL editing、domain/title/URL narrowing、tab result closing、background tab queueing を palette から離れずに実行できる。
- Modern web target handling: links だけでなく、safe menu triggers、media controls、native form controls、semantic ARIA-style controls に hints を出す。
- YouTube/media ergonomics: Safari と site が許す範囲で、hidden media controls を hint collection 前に reveal できる。

## 使う product language

使う:

- keyboard-first Safari navigation
- private command palette
- local-first browsing workflow
- site-aware shortcuts
- Japanese IME-friendly keyboard handling
- link hints, tab search, bookmark search, history search

避ける:

- Vimium-compatible
- Vomnibar
- Vim clone
- better than Vimium
- replacement for Vimium

## Competitive message

これは、App Store distribution、Safari permissions、clear privacy、日本語 IME safety、per-site control を諦めずに keyboard speed がほしい Safari users のための product です。

message は「Vim workflow をコピーした」ではありません。「privacy を尊重し、日常の browsing でちゃんと使える Safari-native keyboard launcher を作った」です。

## Pricing rationale

有料版は shortcut の数だけではなく、reliability と trust の bundle として説明できます。

- Safari-first setup and support。
- Privacy-first local processing。
- Configurable shortcuts and site controls。
- Repeated tab、bookmark、history、search workflows を置き換える command palette。
- 日本語 IME と shortcut conflict への配慮による daily friction の削減。

paid upfront を超える monetization に進む場合は、StoreKit、purchase restoration、review notes、support docs を実装・検証してから提出します。
