# Safari Keyboard Navigation Extension

この日本語版は `README.md` の翻訳です。内容が異なる場合は英語版を優先します。

Vimium のようなリンク Hint とページ移動を Safari で使うための、小さく監査しやすい Safari Web Extension です。Vimium 互換を目指すのではなく、ブラウザ自動化スイートにも広げすぎず、必要な操作に絞ります。

## MVP の挙動

- `f` で、通常の `http` / `https` ページと local `file:` HTML page の現在の viewport に見えているリンク、安全な navigation menu trigger、境界付けられた media player control、native form control、semantic custom control に、黄色背景・黒文字のコンパクトな Hint を表示します。
- リンクの Hint を最後まで入力すると、そのリンクの通常のクリック動作を現在タブで実行します。
- navigation menu trigger の Hint を最後まで入力すると、まず trigger に focus し、focus でリンクが表示されない場合だけ明示的な disclosure 形式の trigger を安全に click して、見えている target を再スキャンします。
- media player control の Hint を最後まで入力すると、YouTube の player control など、認識済み player chrome 内の見えている control に focus して click します。
- 認識済み media control が隠れている場合、`f` は player surface の Hint を表示することがあります。その Hint は player に focus し、best-effort の reveal event を送り、新しく見えた control を再スキャンします。
- form control の Hint を最後まで入力すると、テキスト入力系は末尾に caret を置いて focus し、button、checkbox、radio、select などは通常の click/focus 挙動を実行します。
- semantic custom control の Hint を最後まで入力すると、ARIA tab、button、link、inline expander などの通常の click/focus 挙動を実行します。
- `Shift+F` で、見えている `http` / `https` リンクに Hint を表示し、選んだリンクを新しい前面タブで開きます。
- `Esc` で Hint mode をキャンセルします。
- `h`、`j`、`k`、`l` で滑らかに小刻みスクロールし、押し続けると滑らかに続けてスクロールします。
- `u` と `d` で半ページ分、上下へ滑らかに移動します。
- `g` を短い間隔で 2 回押すとページ上端へ移動します。
- `Shift+G` でページ下端へ移動します。
- `Shift+H` で現在タブの履歴を戻り、`Shift+L` で進みます。
- `r` で通常のページフォーカスから現在のページを再読み込みします。
- text input、textarea、編集可能な要素にフォーカスしているときは、`Esc` でフォーカスを外し、通常のページフォーカスに戻します。
- `Shift+J` で左のタブへ移動し、`Shift+K` で右のタブへ移動します。
- Safari Start Page、address bar、browser chrome にフォーカスがあるときは、browser-level fallback として `Option+Shift+J` / `Option+Shift+K` で左右のタブへ移動します。
- `o` で browser navigation palette を開き、browser window をまたいで開いている tab、bookmark、recent history、ローカルで観測した page、extension command、direct URL、設定した search engine での web search を検索します。
- Palette prefix として `tab:`、`book:`、`history:`、`visit:`、`cmd:`、`url:`、`search:` を使うと検索対象や意図を絞れます。
- `Option+C` で、選択中の command palette browser destination URL を開かずにコピーします。
- `Option+Backspace` で、選択中の local visit result、または呼び戻し中の palette query を忘れさせます。
- `Option+W` で、選択中の open-tab result を command palette から閉じられます。
- `Option+1` から `Option+9` で、対応する表示中の command palette result を開けます。
- `Option+Up` / `Option+Down` で、最近の command palette query を呼び戻せます。
- Command palette から開いた browser destination はローカルに記録され、最近選んだ destination を再検索しやすくします。
- `Shift+O` で palette の結果を新しい前面 tab で開きます。
- 生成される web search result は、Google、DuckDuckGo、Brave Search、Kagi、または `{query}` を含む custom URL template を使えます。
- `b` / `Shift+B` で bookmark を現在 tab / 新しい前面 tab 向けに検索します。
- `Shift+T` で browser window をまたいで開いている tab を検索します。
- `y` を短い間隔で 2 回押すと、現在のページ URL をコピーし、小さな確認表示を出します。
- `?` でキーボードショートカットのヘルプ overlay を開き、`Esc` で閉じます。
- テキスト入力、textarea、select、編集可能な要素では通常の入力を邪魔しません。
- PDF ではページ移動だけを best effort で扱い、PDF 内リンクの Hint は MVP の対象外です。

## リポジトリ構成

- `src/`: content script の TypeScript ソース。
- `web-extension/`: Safari が読み込む Web Extension パッケージ。JavaScript は `src/` から生成されます。
- `xcode/`: 生成された macOS Safari Web Extension app project。
- `tests/`: 純粋な JavaScript ロジックの Node tests。
- `CONTEXT.md`: プロジェクトの用語集とドメイン言語。
- `docs/research/ipados-safari-support.md`: iPadOS Safari compatibility spike のメモ。
- `docs/research/bookmark-history-open-command.md`: bookmark/history を使った destination search の互換性 spike。
- `docs/ja/research/bookmark-history-open-command.md`: bookmark/history open command spike の日本語訳。

## ドキュメント言語

このプロジェクトでは英語ドキュメントを正本とします。日本語翻訳は `docs/ja/` 配下に置き、英語版をもとに作成します。英語版と日本語版の内容が異なる場合は英語版を優先します。

詳しくは `docs/ja/process/documentation-language.md` を参照してください。

権限とプライバシーの詳細は [権限とプライバシー](permissions-and-privacy.md) を参照してください。

## 日本語ドキュメント

- `docs/ja/contributing.md`
- `docs/ja/process/documentation-language.md`
- `docs/ja/process/github-workflow.md`
- `docs/ja/research/ipados-safari-support.md`
- `docs/ja/research/bookmark-history-open-command.md`

## Build And Test

このマシンでは active な `xcode-select` が Command Line Tools を向いていることがあります。Xcode app を使うため、`DEVELOPER_DIR` を指定します。

```sh
pnpm install
pnpm run check
pnpm run build:xcode
```

`src/*.ts` が編集対象のソースです。`pnpm run build:web` で `web-extension/*.js` にコンパイルし、Safari と Xcode はその生成ファイルを読み込みます。format と lint には Biome を使い、ESLint は使いません。

## 手動テストページ

Safari に拡張を読み込んだあと、manual test page を `http` で配信します。

```sh
python3 -m http.server 8765
```

その後、Safari で `http://localhost:8765/manual-test/` を開きます。

確認観点:

- 見えているリンク、安全な navigation menu trigger、native form control、semantic custom control に Hint が表示される。
- 安全な navigation menu trigger に Hint が表示され、activation 後に新しく表示されたリンクが再スキャンされる。
- 見えている境界付けられた media player control に Hint が表示され、通常の click/focus 挙動で activate される。
- `role="tab"` など、見えている semantic custom control に Hint が表示される。
- 表示されている text/content が layout box を持つ `role="button"` expander など、inline の semantic custom control に Hint が表示される。
- 別の text link が accessibility label を持つ visual thumbnail link など、見えている `aria-hidden` link に Hint が表示される。
- `Shift+F` で見えている `http` / `https` リンクを新しい前面タブで開ける。
- text input と textarea の Hint を最後まで入力すると、末尾に caret が置かれて focus される。
- checkbox、radio、button、select の Hint を最後まで入力すると通常の click/focus 挙動が実行される。
- semantic custom control の Hint を最後まで入力すると通常の click/focus 挙動が実行される。
- 見えている media control の Hint を最後まで入力すると通常の click/focus 挙動が実行される。
- YouTube watch page では、Safari と YouTube が synthetic reveal event を受け付ける範囲で、`f` を押すと隠れている player control を表示してから Hint を収集する。見えている play/pause、mute、captions、settings、theater/miniplayer、fullscreen control に Hint が表示される。
- disabled、hidden、offscreen の control には Hint が付かない。
- 複数行に折り返されたリンクにも Hint は 1 つだけ付く。
- hidden link には Hint が付かない。
- `href="#"` や `javascript:` のリンクは通常のクリック動作で発火する。
- focus で表示される navigation menu と click で表示される disclosure menu を Hint で開け、そのあと新しく見えた menu link に通常の Hint が表示される。
- `Esc` で Hint mode をキャンセルできる。
- input、textarea、編集可能な要素への入力が奪われない。
- `j/k` で滑らかな単発の縦スクロール、`h/l` で可能な場所では滑らかな単発の横スクロール、長押しでは引っかかりなく連続スクロールへ移ること、`u/d` で滑らかな半ページ移動、`gg` で上端、`Shift+G` で下端へ移動できることを確認する。
- `manual-test/history-a.html` を開き、`history-b.html` に移動したあと、`Shift+H` で戻り、`Shift+L` で進める。
- 通常のページフォーカスで `r` を押し、Reload Command の page load count が増える。
- input、textarea、編集可能な要素にフォーカスした状態で `r` を押し、再読み込みされず通常通り入力される。
- `f` を押してから Hint mode 中に `r` を押し、再読み込みではなく Hint mode 側でキーが処理される。
- `f` を押し、複数文字 Hint の最初の文字を入力して、入力済み prefix が赤くなり、残りの Hint 文字は通常色のままであることを確認する。
- text input、textarea、編集可能な要素にフォーカスした状態で `Esc` を押し、フォーカスが外れる。
- 拡張を有効にした Safari タブを 3 つ以上開き、`Shift+J` で左のタブへ、`Shift+K` で右のタブへ移動できる。
- Safari Start Page または address bar にフォーカスし、`Option+Shift+J` で左のタブへ、`Option+Shift+K` で右のタブへ移動できる。
- local `file:` HTML page を開き、Safari で必要に応じて拡張の local file access を許可したあと、`f` で Hint が表示され、ページ移動コマンドが動く。
- `manual-test/frame-host.html` を開き、frame 内をクリックしたあと、`Shift+J/K` でタブ移動でき、`f` で frame 内の Hint が表示される。
- `yy` を押してから text input に paste し、現在のページ URL がコピーされたことを確認する。
- `y` を押し、少し待ってからもう一度 `y` を押し、URL がコピーされないことを確認する。
- `y` を押してから `Esc` を押し、もう一度 `y` を押しても URL がコピーされないことを確認する。
- `f` を押してから Hint mode 中に `yy` を押し、URL コピーではなく Hint mode 側でキーが処理されることを確認する。
- 通常のページフォーカスで `?` を押し、ショートカットヘルプ overlay が読みやすく、現在のコマンドを一覧でき、`Esc` で閉じられることを確認する。
- 拡張機能を有効にした状態で `http` または `https` page を開き、別の page へ移動したあと、`o` を押して前の page title または URL を入力し、ローカルで観測した page result を開けることを確認する。
- 通常のページフォーカスで `o` を押し、tab title、bookmark title、history URL、ローカルで観測した page、command name、URL、search term を入力して、`Enter` で選択結果が開くか実行されることを確認する。
- palette 内で `url: example.com` と入力し direct URL result だけが出ること、`search: example.com` と入力し web search result だけが出ることを確認する。
- palette 内で `ArrowDown`、`ArrowUp`、`Ctrl+n`、`Ctrl+p`、`Tab`、`Shift+Tab` を押し、palette から focus が外れずに選択 result が移動することを確認する。
- palette 内で `Shift+Enter`、`Command+Enter`、`Control+Enter` を押し、browser destination が新しい前面 tab で開くことを確認する。
- palette 内で `Alt+Enter` / `Option+Enter` を押し、browser destination が新しい background tab で開き、active にならないことを確認する。
- palette 内で `Alt+C` / `Option+C` を押し、選択中の browser destination URL が開かれずにコピーされることを確認する。
- palette 内で `Alt+Backspace` / `Option+Backspace` を押し、選択中の local visit result、または呼び戻し中の palette query を忘れさせられることを確認する。
- palette 内で `Alt+W` / `Option+W` を押し、選択中の open-tab result が閉じられて result list が更新されることを確認する。
- palette 内で `Alt+1` / `Option+1` から `Alt+9` / `Option+9` を押し、対応する表示中の numbered result が開くことを確認する。
- palette 内で `Alt+Up` / `Option+Up` と `Alt+Down` / `Option+Down` を押し、最近の palette query を前後に移動できることを確認する。
- `Shift+O` を押し、URL または destination を入力して、`Enter` で新しい前面 tab に開くことを確認する。
- `b` / `Shift+B` を押し、bookmark だけが検索され、`Shift+B` では選択した bookmark が新しい前面 tab に開くことを確認する。
- `Shift+T` を押し、browser window をまたいで開いている tab が検索され、選択した tab に focus することを確認する。
- input、textarea、編集可能な要素にフォーカスした状態で `?` を押し、ヘルプが開かず通常通り入力されることを確認する。
- `f` を押してから Hint mode 中に `?` を押し、ヘルプではなく Hint mode 側でキーが処理されることを確認する。
- `manual-test/nested-scroll.html` を開き、`j/k`、`u/d`、`gg`、`Shift+G` で内部 scroll container が動く。
- `manual-test/body-scroll.html` を開き、`j/k`、`u/d`、`gg`、`Shift+G` で body scroll container が動く。

## Safari で読み込む

### 一時的に読み込む

1. Safari > Settings を開きます。
2. 必要であれば Advanced > Show features for web developers から Developer tab を有効にします。
3. Safari > Settings > Developer で Allow unsigned extensions を有効にします。
4. Add Temporary Extension をクリックし、`web-extension/` フォルダを選択します。
5. 拡張を有効にし、website access を許可します。

Safari は、一時的に読み込んだ拡張を 24 時間後、または Safari 終了時に削除します。

### Xcode app として読み込む

1. Xcode で `xcode/Safari Keyboard Navigation Extension/Safari Keyboard Navigation Extension.xcodeproj` を開きます。
2. Signing & Capabilities で両 target に development team を設定するか、ローカル検証では Sign to Run Locally を選びます。
3. `Safari Keyboard Navigation Extension` scheme を実行します。
4. Safari の Settings > Extensions で拡張を有効にし、website access を許可します。
5. unsigned local development で Safari に拡張が表示されない場合は、Safari の Develop menu を有効にし、unsigned extensions を許可します。

生成された app name は仮の working name であり、product name ではありません。
