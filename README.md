Webサイト　⇒　[Boardgame Quiz](https://boardgamequiz.netlify.app/)

## 概要
ボードゲームに関するクイズを出題するWebアプリケーション（現在β版）。BoardGameGeek(BGG)のデータを利用してクイズを生成します。
## 技術スタック
フロントエンド: Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui
バックエンド: Next.js API Routes
データソース: BoardGameGeek (BGG) API
## 主要機能
1. クイズ出題機能
BGGのボードゲームデータからランダムに問題を生成
現在はレーティング情報を中心に出題（β版）
将来的にジャンルや種類など出題範囲を拡張予定
2. 結果表示機能
スコアに応じたメッセージ表示
10点満点での採点
トップページへの戻るボタン