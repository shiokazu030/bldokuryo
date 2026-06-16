# BL読了カードメーカー

読了カードを作成し、公開カードとしてサイト内に保存できるMVPです。

タイトルは審査提出済みのため、サイト名は `BL読了カードメーカー` のままにしています。

## 構成

- `index.html`: フロントエンド本体
- `_redirects`: `/cards`, `/card/:id`, `/tag/:tag` のSPA表示用
- `functions/api/cards/index.js`: 公開カード一覧取得・投稿作成
- `functions/api/cards/[id].js`: 個別カード取得・削除
- `functions/api/tags/[tag].js`: タグ別カード一覧取得
- `migrations/0001_create_cards.sql`: D1テーブル作成SQL
- `migrations/0002_seed_sample_cards.sql`: サンプル投稿SQL

画像ファイルはDBに保存しません。公開カードは保存データからcanvasで再生成します。
DB未設定時は、フロントエンド側のサンプルカードを一覧・個別ページに表示します。

## Cloudflare Pages設定

Cloudflare Pagesの設定は以下です。

```text
Framework preset: None
Build command: 空欄
Build output directory: /
Functions directory: functions
```

すでにPagesプロジェクトをGitHub連携している場合は、pushすると自動デプロイされます。

## D1設定

Cloudflare DashboardでD1データベースを作成します。

例:

```text
Database name: dokuryo-db
Binding name: DB
```

Pagesプロジェクトの設定で、D1 database bindingを追加してください。

```text
Settings > Functions > D1 database bindings
Variable name: DB
D1 database: dokuryo-db
```

## migration適用

Cloudflareのローカル環境でWranglerを使う場合:

```powershell
npx wrangler d1 migrations apply dokuryo-db --remote
```

またはCloudflare DashboardのD1 SQL画面で、以下のSQLを実行してください。

```text
migrations/0001_create_cards.sql
```

サンプル投稿もDBに入れたい場合:

```text
migrations/0002_seed_sample_cards.sql
```

## API

```text
GET    /api/cards?limit=20
POST   /api/cards
GET    /api/cards/:id
DELETE /api/cards/:id
GET    /api/tags/:tag?limit=20
```

## DMMリンク

審査中のため、現在はアフィリエイトIDを入れずに通常のDMM検索URLへリンクしています。
審査通過後に差し替えやすいように、DMM検索URL生成は `createDmmSearchUrl` にまとめています。

## MVPで入れている荒らし対策

- 作品名80文字まで
- 感想160文字まで
- 外部URL入力の拒否
- 簡単なNGワードフィルター
- IPハッシュによる30秒連投防止
- 削除用パスワードによる公開カード削除
- コメント、いいね、フォロー、通知なし

## 公開URL

Cloudflare Pages:

```text
https://dokuryo.pages.dev
```
