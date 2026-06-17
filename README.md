# BL読了カードメーカー

読了カードを作成し、公開カードとしてサイト内に保存できるMVPです。

タイトルは審査提出済みのため、サイト名は `BL読了カードメーカー` のままにしています。

## 構成

- `index.html`: フロントエンド本体
- `_redirects`: `/create`, `/cards`, `/card/:id`, `/tag/:tag`, `/work/:slug` のSPA表示用
- `functions/api/cards/index.js`: 公開カード一覧取得・投稿作成
- `functions/api/cards/[id].js`: 個別カード取得・削除
- `functions/api/tags/[tag].js`: タグ別カード一覧取得
- `migrations/0001_create_cards.sql`: D1テーブル作成SQL
- `migrations/0002_seed_sample_cards.sql`: サンプル投稿SQL
- `migrations/0003_add_discovery_fields.sql`: 作品まとめ・人気順用の追加SQL

画像ファイルはDBに保存しません。公開カードは保存データからcanvasで再生成します。
DB未設定時は、フロントエンド側のサンプルカードを一覧・個別ページに表示します。

## Cloudflare Pages設定

Cloudflare Pagesの設定は以下です。

```text
Framework preset: None
Build command: 空欄
Build output directory: docs
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
GET    /api/cards?limit=20&sort=popular
POST   /api/cards
GET    /api/cards/:id
POST   /api/cards/:id?action=share
DELETE /api/cards/:id
GET    /api/tags/:tag?limit=20
```

## 作品まとめ・ランキング

同じ作品なのに表記ゆれで別ページになりすぎないよう、カード保存時に `work_key` を作っています。
空白、句読点、かっこ、巻数らしき表記を落として、`/work/:work_key` にまとめます。

人気カードはまず `view_count` を使います。
`/card/:id` が表示されるたびに閲覧数を加算し、`/api/cards?sort=popular` で人気順を取得できます。

トップには一般投稿とは別に「管理人のおすすめ」枠を置いています。
実在作品を追加する場合は、読んでいない断定レビューではなく、紹介コメント・おすすめメモとして扱う想定です。

## 管理人おすすめ

`adminPickCards` に実在BL作品ベースの紹介メモを50件入れています。
これはユーザー投稿の読了感想ではなく、初期導線用の「管理人おすすめ」「紹介メモ」です。

- トップページ: 6件だけ表示
- `/admin-picks`: 50件一覧
- `/card/:id`: 管理人おすすめカードの詳細表示
- `/work/:work_key`: 同じ作品ページへの導線

DMMレビュー本文は転載せず、作品名・作者名・ジャンル感をもとに独自の短い紹介文にしています。

### 審査待ち中に強化している導線

- `/admin-picks` は「初心者向け」「甘々」「泣ける」「重め」「青春」「刺激強め」で絞り込めます。
- 作成画面の作品名入力には既存作品候補を出し、同じ作品ページにまとまりやすくしています。
- `/work/:work_key` では同じ作品にまとまったカード数、投稿数、紹介メモ数、よく使われるタグを表示します。
- 人気順は `view_count + share_count * 3` を使う形にして、将来的にX共有が多いカードも上がりやすくしています。

## DMMリンク

審査中のため、現在はアフィリエイトリンクもDMM検索リンクも表示していません。
審査通過後に差し替えやすいように、フロントエンド側に以下の設定だけ用意しています。

```js
const ENABLE_AFFILIATE_LINKS = false;
const DMM_AFFILIATE_ID = "";
const ENABLE_PURCHASE_PLACEHOLDER = false;
function buildDmmAffiliateUrl(workTitle) {
  if (!ENABLE_AFFILIATE_LINKS || !DMM_AFFILIATE_ID || !workTitle) return "";
  return "";
}
```

`ENABLE_AFFILIATE_LINKS` が `false` の間は、購入導線を表示しません。
アフィリエイト審査が通るまでは `DMM_AFFILIATE_ID` を空のままにしてください。

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
