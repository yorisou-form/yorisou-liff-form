# よりそう 支援依頼 LIFF フォーム

一般社団法人よりそう LINE公式アカウント用の、LINE内支援依頼フォームです。

- LIFF ID: `2012611374-Vn57eys9`
- LINE Login チャネル: `2012611374`（公開済み）
- 送信方法: トーク内では `liff.sendMessages` で構造化テキストを投稿。トーク外・送信失敗時は `https://line.me/R/oaMessage/@065boblz/?` で公式アカウントのトークを開き、同じ本文を入力欄に入れる（既存 Webhook / ルーティンで受信）

このフォルダは静的ファイルだけです。サーバー側の新規 API は使いません。

## ファイル

| パス | 内容 |
|---|---|
| `index.html` / `styles.css` / `app.js` | フォーム本体（モバイル向け・緑基調） |
| `favicon.png` | サイトアイコン |
| `MESSAGE_FORMAT.md` | ルーティンがパースするメッセージ形式と受付返信の例 |
| `使い方返信.txt` | リッチメニュー「使い方」への返信本文 |
| `rich-menu/rich-menu.png` | 2500×843 のリッチメニュー画像（未適用） |
| `rich-menu/rich-menu-preview.png` | 確認用プレビュー |
| `rich-menu/rich-menu.json` | エリア定義（左: LIFF、右: 「使い方」） |
| `rich-menu/apply_rich_menu.sh` | 適用スクリプト（**承認があるまで実行しない**） |
| `.github/workflows/pages.yml` | GitHub Pages 用ワークフロー |

## ホスティング状況（2026-11-14）

GitHub Pages で公開済みです。公開 URL（末尾スラッシュ付き）:

```
https://yorisou-form.github.io/yorisou-liff-form/
```

リポジトリは `yorisou-form/yorisou-liff-form`、デプロイは GitHub Actions（`pages.yml`）です。LIFF のエンドポイントに GAS HtmlService は使わないでください（iframe / origin の都合で LIFF と相性が悪いです）。

ローカル確認（LIFF 初期化は失敗しますが、画面の見た目は確認できます）:

```bash
cd /workspace/liff_form && python3 -m http.server 8080
```

## LIFF で必要な変更

LINE Developers の LIFF アプリ（ID `2012611374-Vn57eys9`）で、次を変更してください。

1. **エンドポイントURL** は `https://yorisou-form.github.io/yorisou-liff-form/`（末尾スラッシュ付き）。
2. **Scope** に、既存の `profile` に加えて **`chat_message.write`** を追加する。これがないと `liff.sendMessages` が失敗し、トークに依頼が届きません。追加後、利用者にはメッセージ送信の許可確認が出ます。
3. LINE Login チャネルの **Callback URL** に、少なくとも次を入れる。
   - `https://liff.line.me`
   - 公開したエンドポイント URL（上記と同じ）
4. サイズは **Full** のままで問題ありません。

## リッチメニュー（未適用）

画像と JSON は用意済みですが、**公式アカウントにはまだ設定していません。** 適用には管野さんの明示的な承認が必要です。

- 左半分（0,0,1250,843）: URI `https://liff.line.me/2012611374-Vn57eys9`（支援依頼フォーム）
- 右半分（1250,0,1250,843）: メッセージ「使い方」
- 画像は 2500×843 PNG、約 55KB（上限 1MB 未満）

承認後は、環境変数 `LINE_CHANNEL_ACCESS_TOKEN` を使って `rich-menu/apply_rich_menu.sh --apply` で作成・画像アップロード・デフォルト設定ができます。トークンは表示しません。

## ルーティン側で追加する動き

1. 先頭行が `【支援依頼フォーム】` のテキストを支援依頼として扱う（詳細は `MESSAGE_FORMAT.md`）。
2. 受付番号（例: `REQ-20261114-001`）を採番し、「支援依頼を受け付けました」「担当者への確認待ちです。」を含む返信を返す。
3. ユーザーが「使い方」と送ったら `使い方返信.txt` を返す。
4. 支援の種類に「買物支援」が入ります。受診同行以外では、開始時間と場所を別欄で送れます（どちらも任意。空欄は「未定」）。
5. `緊急度：` の行は届きません。不要です。
6. 希望日が `希望日なし` のときは日程未定です。受付番号は返し、【仮】登録はせず、管野さんへ引き継いでください。希望日があるときだけ、現行どおり【仮】登録と通知を進めます。
