# 競合メモ

この日本語版は `docs/research/competitors.md` の翻訳です。内容が異なる場合は英語版を優先します。

調査日: 2026-05-24

## Executive Takeaway

このプロジェクトは、Vim 風の Safari ナビゲーションが新しいと主張すべきではない。Vimari、Vifari、Vimlike はすでにこのカテゴリの需要を示している。

より明確な差分は、プロダクトの形にある。

- **Vimari** は Safari 拡張として最も近い先行例だが、公開されている保守履歴が古く、継続性に不安を持つユーザーがいる。
- **Vifari** は強力で確認しやすいが、通常の Safari 拡張ではなく、Hammerspoon と macOS アクセシビリティ自動化を使うツールである。
- **Vimlike** は最も多機能で製品化された選択肢だが、日常的な中核操作だけを求めるユーザーには広すぎることがある。
- **このプロジェクト** は、見えているページ内のナビゲーション、つまり link/control hints、予測しやすいページ移動、意図的に小さなコマンドセットを提供する、小さく公開された現行 Safari Web Extension として位置づける。

中核メッセージは「他より Vimium らしい」ではない。「日常的なキーボードナビゲーションの輪を覆う、最小で理解しやすい Safari 拡張」である。

## 比較表

| プロジェクト | プロダクトの形 | 強く向いている用途 | 対象ユーザーにとってのトレードオフ | このプロジェクトの差分 |
| --- | --- | --- | --- | --- |
| このプロジェクト | 公開 Safari Web Extension | 小さなコマンドセットで、見えている link/control hints とページ移動を使いたいユーザー | 早期プロジェクトであり、既存ツールよりコマンドは少ない | 小さく、確認しやすく、現行 Safari 向けで、驚きが少ない Safari 拡張 |
| Vimari | Vimium に影響を受けた OSS Safari 拡張 | 確立されたデフォルトを持つ軽量な Vimium 風 Safari 拡張を使いたいユーザー | 公開リリースとコード更新が古く、継続性に不安が残る | 同じ Safari 拡張の領域で、見える保守活動と、より絞った first-party scope を持つ |
| Vifari | Safari 向け OSS Hammerspoon/Lua 自動化 | Hammerspoon を信頼しており、content script を超えて Safari UI やシステム側まで触りたいユーザー | Hammerspoon、アクセシビリティ権限、システム自動化としての理解が必要 | Safari Web Extension モデルにとどまり、中核体験では外部自動化を避ける |
| Vimlike | Apple プラットフォーム横断の App Store Safari 拡張 | 広いコマンド、設定、同期、カスタムキーバインド、スクリプト、多くの組み込み操作を求めるユーザー | link hints とページ移動だけを求めるユーザーにはプロダクト面が広く感じられることがある | 機能量では競わず、絞り込み、明快さ、確認しやすさで差別化する |

## 位置づけの境界

このプロジェクトは、次の弱い主張を明確に避ける。

- **「唯一の Vim 風 Safari 拡張」ではない**: これは事実ではない。
- **「最も強力な Safari キーボードツール」ではない**: Vifari と Vimlike は、それぞれ別の方向でより広い。
- **「完全な Vimium クローン」ではない**: すべてのコマンドを複製すると、このプロジェクトの最も明確な利点が消える。

より強い主張は次の通り。

- システム自動化レイヤーではなく、Safari Web Extension である。
- ブラウザ全体の自動化ではなく、見えているページ内のナビゲーションから始める。
- ユーザーが挙動全体を理解できる程度に、コマンドセットを小さく保つ。
- form controls や media controls のような新しい対象は、なんでもクリック対象に広げるのではなく、境界のあるカテゴリとして扱う。
- ドキュメント、Issue、PR、テストを公開し、ユーザーがプロジェクトの方向性を確認できるようにする。

## Vimari

Source:
- https://github.com/televator-apps/vimari
- https://apps.apple.com/us/app/vimari/id1480933944?mt=12

Positioning:
- Vimium に影響を受けた OSS Safari 拡張。
- Mac App Store と GitHub releases で配布されている。
- Mac のみ。
- 2026-05-24 時点で、最新 GitHub release は 2020-09-10 公開の `v2.1.0`、default branch の最新 commit は 2021-04-12 である。

Relevant behaviors:
- `f` は link hints を現在タブで開く。
- `F` は link hints を新しいタブで開く。
- `h/j/k/l` は左/下/上/右にスクロールする。
- `gg` と `G` はページ上端/下端へ移動する。
- smooth scrolling、設定可能な hint characters、scroll size、excluded URLs、normal/insert mode、cursor style による追加検出をサポートする。

Notes for this project:
- Vimari は Safari 拡張として最も近い比較対象である。
- MVP より広い機能を持つ。履歴、タブ、reload、新規タブ、タブを閉じる、settings、normal/insert mode などがある。
- 公開されている保守活動の古さは、ユーザーにとって不安材料になり得る。アプリが今も動いていたとしても、最近の公開コードやリリース活動がない Safari 拡張に依存することをためらうユーザーがいる。
- このプロジェクトの MVP は、現在タブでの link activation、ページ移動、そして小さな操作モデルを保つ次のコマンドに絞るべきである。

## Vifari

Source:
- https://github.com/dzirtusss/vifari

Positioning:
- Safari キーボードナビゲーション向けの OSS Hammerspoon/Lua ツール。
- ブラウザ拡張ではなく、macOS アクセシビリティ自動化を使う。
- Homebrew または手動の Hammerspoon setup で導入できる。

Relevant behaviors:
- `f` は marks を表示し、同じ window で移動する。
- `F` は marks を表示し、新しい window で移動する。
- `h/j/k/l` は左/下/上/右にスクロールする。
- `gg/G` は上端/下端へスクロールする。
- insert mode、forced unfocus、tab navigation、URL copying、mouse positioning、customizable mappings を持つ。

Notes for this project:
- Vifari の差分は、Safari extension API を使わないことにある。
- content scripts が触れない Safari UI surface に到達できる一方で、Hammerspoon とアクセシビリティ設定が必要になる。
- MVP ではこの構成をコピーすべきではない。このプロジェクトの目的は、Safari に読み込む Safari 拡張である。
- 公平な比較軸は能力ではなく、導入方法と実行範囲である。Vifari は Web Extension が届かない場所に届く可能性がある。このプロジェクトは、Safari 拡張として理解しやすく導入しやすいことを目指す。

## Vimlike

Source:
- https://www.jasminestudios.net/vimlike/
- https://apps.apple.com/us/app/vimlike/id1584519802?platform=mac

Positioning:
- Mac、iPad、iPhone、Vision 向けの Safari 拡張。
- App Store で配布されている。
- Vimari より製品化され、活発に保守されているように見える。

Relevant behaviors:
- `f` は links を表示し、`shift+f` は link を新しいタブで開く。
- `h/j/k/l` は左/下/上/右にスクロールする。
- `gg` と `shift+g` はページ上端/下端へ移動する。
- MVP を超える多くのコマンドを含む。half-page movement、history、tabs、search bar、reader view、link search、video controls、dark mode、help、website-specific settings、iCloud setting sync、custom key bindings、scripts など。
- App Store の privacy listing では、このアプリは data を収集しないとされている。

Notes for this project:
- Vimlike は最も強いユーザー向け競合である。
- 洗練された Safari Vim 風体験への需要を示している。
- 同時に、広範な設定可能コマンドスイートではなく、日常的なキーボードナビゲーションの輪に絞った、小さく確認しやすい拡張の余地も作っている。

## MVP への示唆

- MVP は意図的に狭く保つ。`f` link hints、現在タブでの click activation、`h/j/k/l`、`gg`、`G`。
- まだ機能量では競わない。Vimlike と Vimari はすでに多くのコマンドを持っている。
- シンプルさ、驚きの少なさ、確認しやすい挙動、見える保守活動で競う。
- new-tab activation、tab control、history、search、form controls、media controls、settings、custom scripts は明示的な後続フェーズとして扱う。
- 新しい機能は、キーボード中心のページナビゲーションを説明しやすいまま強化する場合にだけ追加する。
