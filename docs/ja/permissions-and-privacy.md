# 権限とプライバシー

Safari Keyboard Navigation は Safari 内でローカルに動作します。analytics、telemetry、広告 SDK、remote logging、閲覧データをサーバーへ送るための network code は含みません。

## 拡張機能がアクセスできるもの

ユーザーが Safari で website access を許可すると、content script は許可された Web サイトのページ構造を読めます。これには、見えている link、button、form control、media control、要素の位置、現在のページ URL が含まれます。

browser navigation palette が有効な場合、拡張機能は keyboard から destination を検索して開くために、開いている tab、bookmark、recent history への browser-level access も要求します。

拡張機能は、有効な状態で観測した page と、ユーザーが command palette から明示的に開いた安全な destination の bounded な local list も保存します。各 entry に含まれるのは page URL、page title、最後に観測または選択した時刻、visit count だけです。この local index により、Safari が runtime で bookmark や history API を公開しない場合でも、command palette から destination を探しやすくします。拡張機能は、keyboard から以前の palette 入力を呼び戻せるように、最近の command palette query の bounded な local list も保存します。

このアクセスは次の目的で使います。

- 見えている target の近くに keyboard hint label を表示する
- 入力された hint に対応する target に focus / click する
- keyboard shortcut で現在のページを移動する
- URL copy shortcut が押されたときに現在のページ URL をコピーする
- tab を切り替える、または選択された link を新しい tab で開く
- command palette が開いているときに、開いている tab、bookmark、recent history、ローカルで観測した page destination を検索する
- ユーザーが生成された search result を明示的に選んだ場合に、入力された search query を設定した search engine で開く

## 収集しないもの

この拡張機能は次のことをしません。

- page content、browsing history、URL、keystroke、form value を外部サーバーへ送信する
- page content、form value、完全な browser history を保存する
- cookie を読む
- analytics や telemetry を使う
- input field に入力された text を記録する
- settings を開発者管理の backend に同期する

settings、最近の command palette query、ローカルで観測した page / 選択した destination の index は、ユーザーの端末上の Safari extension storage に保存する想定です。Command palette の検索結果は必要なときに生成され、開発者管理の service には同期されません。ユーザーは command palette から、呼び戻し中の個別 palette query と、extension が所有する local visit result を忘れさせることができます。ユーザーが入力した web search は、生成された search result をユーザーが選んだ場合だけ端末外に出て、その送信先は設定した search engine または custom search URL template だけです。生成された web search result は local destination index には保存しません。

## Website access mode

Safari は、拡張機能がどの Web サイトにアクセスできるかを制御します。プライバシーを重視する場合、ユーザーは keyboard navigation を使いたい Web サイトだけに access を許可するべきです。

拡張機能側にも allowlist / blocklist を用意し、document editor や web app のような native keyboard shortcut が多いサイトでは keyboard navigation を無効化できるようにします。

## Local file access

development build は local `file:` HTML page をサポートしています。これは生成された report や local documentation には便利ですが、local document には private information が含まれることがあるため、local file access は privacy-sensitive です。

App Store 配布では、local file support は次のどちらかにします。

- public manifest の default から外す
- Safari でユーザーが明示的に local file access を許可した場合だけ動く optional capability として明確に説明する

## App Review note draft

This app contains a Safari Web Extension for keyboard-first page navigation. The extension reads visible page elements only on websites where the user grants Safari extension access. Page structure is processed locally to display keyboard hint labels and run keyboard commands. The extension also uses Safari's tabs, bookmarks, and history APIs locally where available, and stores bounded on-device lists of recent command palette queries and observed or explicitly selected page URLs and titles, so users can search browser destinations from a command palette. The app does not send page content, browsing data, shortcut activity, or form values to any external server.
