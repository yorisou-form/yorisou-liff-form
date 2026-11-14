# よりそう 支援依頼 LIFF フォーム

一般社団法人よりそう LINE公式アカウント用の、LINE内支援依頼フォームです。

- LIFF ID: `2012611374-Vn57eys9`
- LINE Login チャネル: `2012611374`（現在 Developing）
- 送信方法: `liff.sendMessages` でトークへ構造化テキストを投稿（既存 Webhook / ルーティンで受信）

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
| `.github/workflows/pages.yml` | GitHub Pages 用ワークフロー（未デプロイ） |

## ホスティング状況（2026-11-14）

**まだ公開していません。** このマシンの `gh` は未ログインで、GitHub / Cloudflare / Netlify などの認証もありません。アカウント作成はしていません。

推奨は **GitHub Pages**（HTTPS・静的・無料）です。LIFF のエンドポイントに GAS HtmlService は使わないでください（iframe / origin の都合で LIFF と相性が悪いです）。

### 公開手順（GitHub Pages）

1. このフォルダを公開リポジトリ `yorisou-liff-form` にする（`gh` ログイン後でも、GitHub の Web からでも可）。
2. ブランチ `main` に置き、GitHub Pages を GitHub Actions（このリポジトリの `pages.yml`）で有効化する。
3. 公開 URL は次の形になります（末尾スラッシュ付きを使う）。

```
https://<GitHubユーザー名>.github.io/yorisou-liff-form/
```

4. 下の「LIFF で必要な変更」を反映する。
5. LINE Login チャネルが Developing の間は、管理者とテスターだけが開けます。一般の依頼者に使うときはチャネルを公開してください。

別案: Cloudflare Pages や Netlify にこのフォルダをドロップしても同じです。必ず HTTPS の URL を LIFF エンドポイントに設定します。

ローカル確認（LIFF 初期化は失敗しますが、画面の見た目は確認できます）:

```bash
cd /workspace/liff_form && python3 -m http.server 8080
```

## LIFF で必要な変更

LINE Developers の LIFF アプリ（ID `2012611374-Vn57eys9`）で、次を変更してください。

1. **エンドポイントURL** を `https://example.com` から、公開した URL（例: `https://<user>.github.io/yorisou-liff-form/`）へ変更する。末尾スラッシュを含める。
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
4. その後の【仮】登録・管野さんへの通知は、現行の支援依頼フローと同じです。
