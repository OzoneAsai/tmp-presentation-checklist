/**
 * GET リクエストを受け取ったときに Index.html を返す
 */
function doGet(e) {
  // Index.html からテンプレートとして読み込み
  return HtmlService
    .createTemplateFromFile('Index')   // テンプレートを読み込む
    .evaluate()                        // HTML を評価（レンダリング）
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // iframe 埋め込みを許可
}

/**
 * HTML ファイルから別ファイルを include するときに使うヘルパー
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
                    .getContent();
}
