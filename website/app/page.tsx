import type { CSSProperties } from "react";

const 網站路徑前綴 = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? "";
const APK下載連結 = "https://github.com/AngleZero-collab/SafeStride/releases/latest/download/SafeStride-mvp-release.apk";
const 原始碼連結 = "https://github.com/AngleZero-collab/SafeStride";

const 痛點列表 = [
  {
    數字: "步速差異",
    標題: "同一個綠燈秒數，不代表每個人都夠用",
    說明:
      "高齡行者可能因步幅縮短、起步較慢或中途停頓，需要比一般成人更充裕的通行時間。",
  },
  {
    數字: "反應負擔",
    標題: "路口資訊太多，容易分散注意力",
    說明:
      "看號誌、注意轉彎車、判斷距離、留意身旁人流，常讓行走本身變成一連串壓力判斷。",
  },
  {
    數字: "跌倒風險",
    標題: "步態不穩時，勉強前進更危險",
    說明:
      "若步頻突然下降、身體晃動變大或停下時間變長，應優先停下、扶穩，再重新判斷是否前進。",
  },
];

const 衛教列表 = [
  "出門前先確認鞋底防滑、拐杖或助行器是否穩固。",
  "過路口前先停一下，讓身體站穩，再觀察車流與行人號誌。",
  "若感覺頭暈、腳步拖曳或步伐忽快忽慢，先退回安全處休息。",
  "夜間或雨天行走時，選擇照明較好、斑馬線清楚的路口。",
];

const App流程列表 = [
  {
    步驟: "01",
    標題: "測量個人步速",
    說明: "App 先用手機動作感測器收集三秒步行資料，建立示範平均步速。",
  },
  {
    步驟: "02",
    標題: "偵測路口停等",
    說明: "使用 GPS 偵測是否停在路口，並以本機估算或 OSM 查詢取得路寬。",
  },
  {
    步驟: "03",
    標題: "顯示安全秒數",
    說明: "以路寬除以最近 10 分鐘平均步速，再加 5 秒緩衝，提醒是否足夠通過。",
  },
];

const 隱私列表 = [
  {
    標題: "不使用攝像頭",
    說明: "目前版本不拍照、不錄影，也不進行號誌影像辨識。",
  },
  {
    標題: "GPS 只用於路口",
    說明: "定位用來判斷是否停在路口；OSM 路寬查詢預設關閉，家屬可選擇開啟。",
  },
  {
    標題: "本機分析",
    說明: "步數、步頻、加速度、陀螺儀與安全秒數都在手機端計算。",
  },
];

export default function Home() {
  const 主視覺樣式 = {
    "--主視覺圖片": `url("${網站路徑前綴}/og.jpg")`,
  } as CSSProperties;

  return (
    <main className="網站頁面">
      <section className="主視覺" style={主視覺樣式}>
        <div className="主視覺遮罩" />
        <nav className="導覽列" aria-label="主要導覽">
          <a className="品牌標記" href="#top" aria-label="SafeStride 安行首頁">
            SafeStride 安行
          </a>
          <div className="導覽連結">
            <a href="#pain-points">痛點衛教</a>
            <a href="#app-demo">App 展示</a>
            <a href="#download">APK 下載</a>
          </div>
        </nav>

        <div className="主視覺內容" id="top">
          <p className="前導文字">AI 陪走夥伴 × SafeStride 安行</p>
          <h1>SafeStride 安行</h1>
          <p className="主標副文">
            把路口寬度、最近 10 分鐘平均步速、加速度與陀螺儀資料，轉成高齡行者能立即理解的安全秒數與紅綠提醒。
          </p>
          <div className="主視覺按鈕列" aria-label="頁面快速連結">
            <a className="主要連結" href={APK下載連結}>
              下載 APK
            </a>
            <a className="次要連結" href="#app-demo">
              看 App 示範
            </a>
          </div>
          <p className="下載提示列">不拍照；定位只用於路口秒數估算，OSM 查詢由家屬設定開關控制。</p>
        </div>
      </section>

      <section className="痛點區塊" id="pain-points" aria-labelledby="痛點標題">
        <div className="區塊標題列">
          <p className="前導文字">痛點與衛教宣傳</p>
          <h2 id="痛點標題">高齡行走安全，不只是「看見綠燈」這麼簡單。</h2>
        </div>

        <div className="痛點卡片列">
          {痛點列表.map((痛點) => (
            <article className="痛點卡片" key={痛點.標題}>
              <strong>{痛點.數字}</strong>
              <h3>{痛點.標題}</h3>
              <p>{痛點.說明}</p>
            </article>
          ))}
        </div>

        <div className="衛教盒">
          <h3>行前與路口安全提醒</h3>
          <ul className="衛教清單">
            {衛教列表.map((衛教) => (
              <li key={衛教}>{衛教}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="示意區塊" id="app-demo" aria-labelledby="示意標題">
        <div className="示意文字">
          <p className="前導文字">App 展示</p>
          <h2 id="示意標題">示範使用 App：首頁就是即時過馬路防護。</h2>
          <p>
            App 不需要複雜操作。高齡使用者開啟後，手機會估算此路口需要幾秒通過，並以全螢幕紅綠色、語音與震動提醒目前狀態。
          </p>
          <div className="公式盒">
            <span>本機分析資料</span>
            <strong>路寬 / 平均步速 + 5 秒</strong>
          </div>
        </div>

        <div className="手機舞台" aria-label="SafeStride 安行 App 示意圖">
          <div className="手機外框 主要手機">
            <div className="手機聽筒" />
            <div className="手機畫面 綠燈畫面">
              <span className="狀態小字">步頻 86 步/分</span>
              <span className="巨大符號">✓</span>
              <strong>步態穩定，安心前進</strong>
              <span className="秒數列">步速 0.72 m/s</span>
            </div>
          </div>

          <div className="手機外框 警示手機">
            <div className="手機聽筒" />
            <div className="手機畫面 紅燈畫面">
              <span className="狀態小字">晃動偏高</span>
              <span className="巨大符號">！</span>
              <strong>步態不穩，請先停下休息</strong>
              <span className="秒數列">急促震動提醒</span>
            </div>
          </div>
        </div>
      </section>

      <section className="流程區塊" aria-labelledby="流程標題">
        <div>
          <p className="前導文字">示範流程</p>
          <h2 id="流程標題">三步驟完成手機端步行分析。</h2>
        </div>
        <ol className="流程清單">
          {App流程列表.map((流程) => (
            <li key={流程.標題}>
              <span>{流程.步驟}</span>
              <strong>{流程.標題}</strong>
              <p>{流程.說明}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="隱私區塊" aria-labelledby="隱私標題">
        <div className="區塊標題列">
          <p className="前導文字">隱私優先</p>
          <h2 id="隱私標題">先把手機端資料分析做好，再逐步擴充。</h2>
        </div>
        <div className="隱私格線">
          {隱私列表.map((項目) => (
            <article className="隱私項目" key={項目.標題}>
              <h3>{項目.標題}</h3>
              <p>{項目.說明}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="下載區塊" id="download" aria-labelledby="下載標題">
        <div>
          <p className="前導文字">直接在手機試用</p>
          <h2 id="下載標題">下載 APK，安裝到 Android 手機測試。</h2>
          <p>
            最新 Release APK 已把 App 程式碼打包進安裝檔，不需要連著電腦或 Metro，就能直接安裝到 Android 手機試用。
          </p>
        </div>
        <div className="下載按鈕列">
          <a className="主要連結 深色連結" href={APK下載連結}>
            前往 APK 下載
          </a>
          <a className="次要連結 原始碼連結" href={原始碼連結}>
            查看 GitHub 專案
          </a>
        </div>
      </section>

      <footer className="頁尾">
        <strong>SafeStride 安行</strong>
        <span>高齡行者步行安全衛教與手機端步態分析 MVP</span>
      </footer>
    </main>
  );
}
