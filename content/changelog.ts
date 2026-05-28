export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  highlights: string[];
};

/** 新 → 舊；版號規則見 docs/CHANGELOG-POLICY.md */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.6.0",
    date: "2026-05-27",
    title: "日記可顯示餐點原圖",
    highlights: [
      "儲存日記時會一併保存你拍的照片",
      "日記列表與詳情頁可查看縮圖與大圖",
      "較早沒有照片的紀錄仍會顯示營養文字",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-05-27",
    title: "拍照後可用對話微調估算",
    highlights: [
      "分析完成後可用聊天說明補充，取得新版本估算",
      "存檔前可選擇要採用的版本",
      "日記詳情可繼續對話並切換版本",
      "訪客可分析；登入後才能使用聊天微調與存日記",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-05-26",
    title: "飲食日記",
    highlights: [
      "確認分析結果後可存入個人日記",
      "「日記」頁可查看最近紀錄並進入詳情",
      "登入後資料會同步到你的帳號",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-05-26",
    title: "Google 登入",
    highlights: [
      "使用 Google 帳號登入，免記密碼",
      "登入後可在多裝置使用同一本日記",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-05-26",
    title: "拍照估算營養（試用）",
    highlights: [
      "上傳餐點照片，由 AI 估算熱量與巨量營養",
      "訪客可直接試用分析功能",
      "可選填文字補充（例如「這是午餐便當」）",
    ],
  },
];
