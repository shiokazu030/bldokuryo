# BL読了カードメーカー

商業BLの読了カード画像を作れる、1ファイル完結のWebサイトです。

## 公開用ファイル

GitHub Pagesで公開する場合は、以下をGitに入れてください。

```text
docs/index.html
README.md
```

## GitHub Pagesで公開する手順

1. ファイルをコミットします。

```powershell
git add docs/index.html README.md
git commit -m "Add BL reading card maker"
git push
```

2. GitHubのリポジトリ画面で以下を設定します。

```text
Settings > Pages
Source: Deploy from a branch
Branch: main
Folder: /docs
```

3. 数分後、GitHub PagesのURLで公開されます。

```text
https://ユーザー名.github.io/リポジトリ名/
```

## 中身

- HTML / CSS / JavaScriptのみ
- 外部ライブラリなし
- canvasで1200 x 1200pxのカード画像を生成
- PNG保存
- X共有
- 作品検索リンク
- スマホ優先表示
