# 有料アプリ化ロードマップ

この日本語版は `docs/strategy/paid-app-roadmap.md` の翻訳です。内容が異なる場合は英語版を優先します。

作成日: 2026-05-24

## SCQ-A

**Situation**:
このプロジェクトは、キーボード中心のページナビゲーションを提供する、小さく公開された Safari Web Extension になりつつある。現在のプロダクトの約束は絞られている。見えている対象への Hint、予測しやすいページ移動、軽量なタブ・履歴操作、そして広い Vimium 風ツールより確認しやすい小さなコマンドセットである。

**Complication**:
収益を出せるアプリには、動く拡張だけでは足りない。ユーザーがなぜ支払う価値があるのか理解でき、Safari 更新後も動き続けると信頼でき、購入不安を減らすだけの polish と support があり、App Store metadata がプロダクトを正確に説明している必要がある。さらに Apple は、App Review の準備、明確な privacy posture、有料アプリまたは In-App Purchase の適切な設定を求める。

**Question**:
このプロジェクトを、信頼して購入される App Store 製品にするために次に何をすべきか。

**Answer**:
まず日常ナビゲーションの中核ループを信頼できる状態まで仕上げる。そのうえで、支払いに見合うだけの product surface、packaging、App Store 準備、support、launch feedback loop を足していく。中核の拡張が安定し、文書化され、安心して購入できる状態になる前に、広いコマンドスイートへ拡大しない。

## 作業前提

- 最初の商用ターゲットは macOS Safari とする。
- iPadOS support は、device testing で現在の Web Extension package が十分だと分かるまでは follow-up とする。
- 公開リポジトリであることは問題ではなく、信頼材料として扱う。収益は App Store 配布、署名、自動更新、文書、support を含む製品体験から得る。
- 初期の課金モデルはシンプルにする。subscription を考える前に、有料買い切り、または無料アプリと non-consumable full unlock を優先する。
- telemetry はデフォルトで避ける。将来 diagnostics を入れる場合も、opt-in、文書化済み、かつ中核挙動に不要であることを条件にする。

## 現在の土台

すでに有用な土台はある。

- Link、form-control、semantic custom-control hints。
- New-tab hint activation。
- 滑らかな page movement と half-page movement。
- Top/bottom movement。
- Back/forward history commands。
- Neighbor tab switching。
- URL copy。
- In-page search は #32 で別途対応中。
- Help overlay、Start Page tab command fallback、navigation-menu hints、iPadOS spike、bookmark/history open-command spike は draft PR または別 work として進行済み。

現時点で一番大きい gap は単一の missing feature ではない。product readiness、つまり real sites での安定性、settings と onboarding、App Store packaging、QA coverage、support process、launch positioning である。

## 課金モデルの推奨

ユーザー調査で subscription value が強く示されない限り、最初はシンプルな one-time purchase model で始める。

推奨順:

1. **有料買い切りアプリ**
   - server cost や継続 content service がない小さな utility に合う。
   - ユーザーにとって理解しやすい。
   - v1 で StoreKit 実装を避けられる。

2. **無料アプリ + non-consumable Pro unlock**
   - try-before-buy が重要な場合に向く。
   - StoreKit、restore purchases、product metadata、review notes、locked/unlocked state が必要になる。

3. **Subscription**
   - cloud sync、team/workflow features、継続的な互換性 support など、ユーザーが recurring value と理解できる継続サービスがある場合だけ使う。
   - support と期待値の負荷が高い。

直近の推奨は、有料買い切り v1 か、小さな Pro unlock の設計にとどめること。アクセシビリティに近い基本ナビゲーションを、分かりにくい細切れ feature gate にしない。課金の約束は「polished, maintained Safari keyboard navigation extension」であるべき。

## Workstreams

### 1. Core Product Reliability

目的: 日常的なブラウジングで信頼できる状態にする。

次にやること:

- help overlay、held scroll stutter、Start Page tab fallback、navigation-menu hints、iPadOS research の open PR を merge するか判断する。
- #32 in-page search を仕上げ、help/manual docs と整合させる。
- #20 media controls は、#16 navigation-menu hint target rules が入ってから解く。どちらも hint target expansion に触るため。
- common page families の manual QA matrix を作る。documentation sites、GitHub、YouTube、search results、news/articles、frames を持つ web apps、PDFs を含める。
- target discovery、command mapping、URL safety、scroll surface selection の extracted logic に regression tests を追加する。
- v1 commands と later commands を明確に分け、launch 前に product が広がりすぎないようにする。

合格シグナル:

- 日常ユーザーが common sites を 30 分 browsing しても、予期しない key capture、壊れた scroll、閉じない overlay が起きない。

### 2. Product Surface

目的: temporary developer extension ではなく、理解できる製品にする。

次にやること:

- final product name、subtitle、短い positioning statement を決める。
- Safari extension の有効化と website access の許可方法を説明する containing app screen を作る。
- 有料ユーザーが期待する少数の settings を追加する:
  - key groups の enable/disable;
  - hint characters;
  - scroll speed または step size;
  - excluded sites;
  - reset defaults。
- help overlay と同じ内容の in-app command reference を追加する。
- Safari で extension を有効化する first-run checklist を追加する。
- containing app に support link、privacy link、version number、diagnostics copy を置く。

合格シグナル:

- 新規ユーザーが GitHub を読まずに app を install し、extension を有効化し、permission を許可し、最初の 5 つの command を理解できる。

### 3. App Store And Packaging

目的: 予期せぬ詰まりなく販売・review できる状態にする。

次にやること:

- 有料買い切りか In-App Purchase unlock かを決める。
- Apple Developer Program membership、bundle IDs、signing certificates、App Store Connect app record を確認する。
- paid app pricing または In-App Purchases を設定する前に Paid Apps Agreement を承認する。
- In-App Purchase を使う場合は、StoreKit、restore purchases、product metadata、review notes、locked/unlocked states を実装する。
- release automation を作る:
  - `pnpm run check`;
  - `pnpm run build:xcode`;
  - archive/export validation;
  - version and build-number updates。
- extension permissions、Safari enablement steps、paid unlock behavior を説明する App Review notes を準備する。
- TestFlight、App Review、本番 release の release checklist を作る。

合格シグナル:

- signed archive を繰り返し build でき、TestFlight で install でき、repo を知らない人でも review できる。

### 4. Privacy, Trust, And Security

目的: 有料アプリとして信頼しやすくする。

次にやること:

- plain English と日本語で public privacy policy を書く。
- product が明示的に変わらない限り、「browsing data を収集・同期・販売しない」を中核の約束として維持する。
- Safari extension permission をなぜ要求するのかをすべて文書化する。
- issue report 向け security policy を追加する。
- injected DOM と CSS の挙動を、page interference と cleanup の観点で review する。
- settings need が明確になるまで persistent local storage を避ける。
- site exclusion や settings storage を追加する場合、何を local に保存するかを文書化する。

合格シグナル:

- privacy-conscious な購入者が、extension が何を見られるか、何を保存するか、何を off-device に送らないかを理解できる。

### 5. UX Polish

目的: 初回セッションで「支払う価値がある」と感じられる状態にする。

次にやること:

- viewport edge や overlapping elements 付近の hint label placement を改善する。
- light/dark pages で overlay の見た目を磨く。
- `Esc`、scroll、resize、navigation で overlay が確実に閉じるようにする。
- smooth movement や animation がある場所で reduced-motion を尊重する。
- `/`、`?`、`Shift+J/K`、Option fallback commands の keyboard layouts と international keyboard behavior を確認する。
- in-page search の "no matches" など、error state を静かだが見える形にする。

合格シグナル:

- ユーザーが「Safari に script を貼ったもの」ではなく、落ち着いて予測できる native に近い道具だと感じる。

### 6. Support And Operations

目的: paid users が Safari や websites の変化で困ったときに戻れる場所を作る。

次にやること:

- setup steps、troubleshooting、contact path を含む support page を作る。
- bug report、site compatibility report、feature request の issue templates を追加する。
- Start Page/browser chrome、PDFs、iframes、YouTube/media controls、unsupported Safari APIs の known limitations page を作る。
- macOS/Safari updates 後の release cadence と compatibility check cadence を決める。
- broad feature requests と top user pain points を分けて追跡する。

合格シグナル:

- extension が動かないユーザーが、5 分以内に common fixes を self-serve するか、役に立つ report を送れる。

### 7. Marketing And Launch

目的: ユーザーがアプリを見つけ、存在理由を理解できるようにする。

次にやること:

- `docs/strategy/why-use-this-app.md` を App Store copy に変換する:
  - app name;
  - subtitle;
  - short description;
  - long description;
  - keywords;
  - support URL;
  - privacy URL。
- title screen だけではなく、実際に extension が動いている screenshots を用意する。
- interaction が screenshots より伝わる場合は short preview video を録る。
- 小さな product page を作る:
  - 何をするか;
  - 誰向けか;
  - privacy promise;
  - setup steps;
  - changelog;
  - support link。
- launch channels を決める:
  - Safari、Mac、productivity、keyboard-focused communities;
  - GitHub release notes;
  - personal blog post;
  - short demo clips。

合格シグナル:

- keyboard-first Safari user が App Store page を見て、「何をするアプリか」「なぜ信頼できるか」「なぜ支払う価値があるか」をすぐ答えられる。

### 8. Business Metrics

目的: 継続する価値がある製品になり得るか判断できるようにする。

次にやること:

- launch 前に小さな target model を定義する:
  - price;
  - expected Apple commission;
  - annual developer program cost;
  - target number of paid users;
  - refund/support load。
- まず non-invasive な public metrics を見る:
  - App Store impressions;
  - product page views;
  - conversion rate;
  - crashes;
  - ratings and reviews;
  - support emails by category。
- 継続投資の条件を決める:
  - revenue threshold;
  - usage feedback;
  - support burden;
  - personal maintenance capacity。

合格シグナル:

- launch 後に、settings、iPadOS、media controls、broader commands のどれに投資すべきかを evidence で判断できる。

## Suggested Milestones

### Milestone 1: Paid v1 Foundation

- 現在の open PR を merge または close する。
- #32 を仕上げるか明示的に defer する。
- #20 は media-player surfaces に収まる場合だけ仕上げる。
- hint keys、scroll speed、excluded sites の settings を追加する。
- polished containing app onboarding screen を追加する。
- privacy policy と support docs を追加する。
- site matrix で manual QA を走らせる。

### Milestone 2: App Store Beta

- App Store Connect record を作る。
- paid app か IAP model を決めて設定する。
- screenshots、privacy details、review notes、support URL を準備する。
- 小さな group に TestFlight build を出す。
- onboarding、permissions、major site compatibility issues を直す。

### Milestone 3: Paid Launch

- 最初の paid version を release する。
- product page と changelog を公開する。
- reviews、crashes、support requests、refund signals を見る。
- launch command set は意図的に小さく保つ。

### Milestone 4: Revenue Expansion

- paid value を強める機能だけ追加する:
  - reliable media controls;
  - configurable commands;
  - site-specific exclusions;
  - testing で強いと分かった場合の iPadOS support;
  - ユーザー要望がある場合の import/export settings。
- platform と product decision が明確になるまで、広い scripts、sync、bookmark/history search は追加しない。

## Backlog To Create

現在の implementation PR queue が落ち着いたら、次の issue を作る。

- Product name and App Store positioning.
- Containing app onboarding screen.
- Settings: hint characters.
- Settings: scroll speed and movement behavior.
- Settings: excluded sites.
- Privacy policy and permission explanation.
- Support and troubleshooting page.
- Manual QA site matrix.
- App Store screenshot and preview plan.
- App Store Connect setup checklist.
- StoreKit/IAP spike, only if choosing a free-with-unlock model.
- TestFlight beta plan.
- Release checklist.
- Crash/reporting and support triage process.
- App Store review notes template.

## Risks And Decisions

| Risk | なぜ重要か | Mitigation |
| --- | --- | --- |
| broad Vimium clone になる | 機能が広がると説明しづらく保守しづらい | v1 command set を小さく保ち、新しい command family には issue-level rationale を必須にする |
| Safari API limitations が expected features を block する | bookmark/history や browser chrome behavior には制限がある | limitations を早めに文書化し、unsupported promises を売らない |
| paid users がすぐ customization を期待する | keyboard users は好みが強いことが多い | launch 前に小さな settings surface を出す |
| paid behavior が不明確で review rejection になる | App Review には complete、visible、understandable な purchase flow が必要 | monetization をシンプルにし、review notes を明示する |
| extension permissions で privacy concern が出る | Web extensions は page content を read/modify できる | permission と privacy docs を明確にし、telemetry をデフォルトで避ける |
| maintenance burden が revenue を超える | Safari と website の変化で壊れる可能性がある | support categories と release cadence を見ながら scope を広げる |

## Source Notes

- Apple は、Safari extensions を Xcode で作成し、App Store の Extensions category で配布できると説明している。
- Apple は、extensions が reliability を確認する review を受けると説明している。
- Apple は、App Store metadata が app の core experience を正確に反映し、screenshots は app in use を示すべきだと説明している。
- Apple は、features や functionality を unlock する場合は In-App Purchase が必要であり、business model や purchases が不明確だと review が遅れたり rejection になり得ると説明している。
- Apple は、paid apps と In-App Purchases には Paid Apps Agreement が必要だと説明している。
- Apple の Small Business Program は、eligible developers の commission を 15% に下げられる。

Sources:

- Apple: Safari Extensions — https://developer.apple.com/safari/extensions/
- Apple: App Review Guidelines — https://developer.apple.com/app-store/review/guidelines/
- Apple: App pricing and availability — https://developer.apple.com/help/app-store-connect/reference/pricing-and-availability/app-pricing-and-availability
- Apple: Set a price for an In-App Purchase — https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/set-a-price-for-an-in-app-purchase/
- Apple: Overview for configuring In-App Purchases — https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/
- Apple: App Store Small Business Program — https://developer.apple.com/app-store/small-business-program/
