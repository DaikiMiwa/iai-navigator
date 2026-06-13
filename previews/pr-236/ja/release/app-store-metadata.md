# App Store Metadata Draft (日本語版)

このドラフトは、Vim、Vimium、Vomnibar などのブランディングに頼らず、独自の Safari ネイティブのキーボードナビゲーションツールとして訴求する目的で作成されています。

## 正式アプリ名

- **IAI for Safari**

## サブタイトル

- キーボード操作でSafariを高速ナビゲート

## Short promotional text (簡単な紹介文)

ヒント表示によるリンククリック、スムーズなスクロール、タブ切り替え、そしてタブ・ブックマーク・履歴・コマンド・URL・Web検索を横断検索できるプライバシー重視のコマンドパレットにより、Safariをキーボードだけで操作できます。

## Description draft (詳細説明ドラフト)

マウスに手を伸ばすことなく、Safariを自在にナビゲート。

このSafari拡張機能は、大量のタブやドキュメント、ダッシュボード、あるいは調査中のWebサイトを常に行き来するユーザー向けに、キーボード優先の高速なブラウジング環境を提供します。リンクヒントの表示、ページ移動、タブ切り替え、ブラウザ内の宛先検索、および一般的なナビゲーションコマンドの実行を、すべて1つのコマンドパレットから行えます。

主な機能：

- リンクヒント：表示されているリンク、ボタン、フォーム入力欄、メニュー、メディアコントロール、セマンティックWeb要素にヒントラベルを表示して選択可能。
- ページ操作：キーボードによるスムーズなスクロール、ページの最上部/最下部へのジャンプ、再読み込み、履歴の戻る/進む、タブの切り替え。
- コマンドパレット：開いているタブ、ブックマーク、閲覧履歴、ローカルのページ訪問履歴、拡張機能コマンド、直接入力したURL、Web検索を横断的に検索。
- 絞り込み検索：`tab:`、`book:`、`history:`、`cmd:`、`url:`、`search:`、`title:`、`domain:` などのプレフィックスを使用したスコープ指定検索。
- パレットアクション：URLコピー、Markdown形式のリンクコピー、URL編集、ドメイン/タイトル/URLでの絞り込み、開いているタブのクローズ、検索結果を現在のタブ・アクティブな新規タブ・バックグラウンドの新規タブで開くなどの操作。
- カスタマイズ：ショートカットキーの設定、サイトごとの無効化/有効化、ヒントの見た目のカスタマイズ。
- 日本語IMEへの配慮：IMEによる文字の入力中や変換確定時のEnterキー押下により、意図せずコマンドパレットが起動したり誤動作したりするのを防止。
- プライバシー保護：アナリティクスなし、広告SDKなし、テレメトリーなし。閲覧データが外部のデベロッパーサーバーに送信されることは一切ありません。

本拡張機能はSafari内で完全にローカルで動作します。Webサイトへのアクセス権限は、表示されているリンクを検出してキーボードヒントを描画するために使用されます。タブ、ブックマーク、履歴へのアクセス権限は、コマンドパレットの検索機能を動作させるために使用されます。

## サポートURL

https://github.com/DaikiMiwa/safari-keyboard-navigation-extension

## プライバシーポリシーURL

https://github.com/DaikiMiwa/safari-keyboard-navigation-extension/blob/main/docs/privacy-policy.md

## Keywords draft (キーワードドラフト)

キーボード, safari 拡張機能, ショートカット, コマンドパレット, タブ検索, ブックマーク, 履歴, リンクヒント, 生産性, ブラウザ操作, iai

※法務確認が取れるまでは、サードパーティのアプリ名や商標登録された用語をキーワードに含めないでください。

## Review notes draft (審査チーム向けメモ - 英語原文)

※Appleの審査チームは英語で対応するため、以下をそのままApp Store Connectの「審査メモ」にコピー＆ペーストして使用してください。

This app contains a Safari Web Extension for keyboard-first page navigation. The extension reads visible page elements only on websites where the user grants Safari extension access. Page structure is processed locally to display keyboard hint labels and run keyboard commands.

The command palette uses Safari tabs, bookmarks, and history APIs where available. It also stores bounded on-device lists of recent command palette queries and observed or explicitly selected page URLs and titles so users can search browser destinations from the keyboard.

The app does not include analytics, advertising SDKs, telemetry, remote logging, or any developer-controlled server for browsing data. It does not send page content, browsing data, shortcut activity, keystrokes, or form values to the developer.

Suggested review path:

1. Launch the app and follow the Safari enablement instructions.
2. Allow the extension on a test website.
3. Press `f` to show keyboard hints.
4. Press `o` to open the command palette.
5. Search an open tab, bookmark, history item, URL, or command.
6. Press `Enter` to open or run the selected result.

## Screenshot storyboard (スクリーンショットの構成案)

1. タブ、ブックマーク、履歴、コマンド、URL、Web検索を横断検索するコマンドパレット。
2. 通常のWebページ上に表示されるリンクヒント。
3. サイトごとのアクセス制御とショートカット設定画面。
4. ホストアプリ（Macアプリ本体）内のプライバシーおよび権限の説明。
5. 個人情報を含まない形で、日本語IMEでパレットに入力している様子（表現可能であれば）。
