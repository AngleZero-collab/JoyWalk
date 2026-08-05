const 痛點列表 = [
  {
    數字: "25秒",
    標題: "秒數不是人人都夠用",
    說明:
      "以 20 公尺斑馬線與 0.8 公尺/秒步速估算，高齡行人至少需要約 25 秒才能安心通過。",
  },
  {
    數字: "3件事",
    標題: "路口同時要判斷太多資訊",
    說明:
      "看號誌、注意轉彎車、估算距離與步速，對視力、聽力與反應速度都形成壓力。",
  },
  {
    數字: "0上傳",
    標題: "安全提醒不該犧牲隱私",
    說明:
      "相機畫面、定位與動作資料都應在手機本機處理，判斷後立即釋放，不留下個人影像。",
  },
];

const 流程列表 = [
  "測量個人平均步速",
  "啟動散步守護模式",
  "本機辨識綠燈剩餘秒數",
  "比較所需秒數與剩餘秒數",
  "以全螢幕顏色、語音與震動提醒",
];

const 隱私列表 = [
  {
    標題: "相機影格本機處理",
    說明:
      "Demo 以模擬資料代表號誌辨識；正式版可替換為 JSI 或 Native Modules 串接的輕量化模型。",
  },
  {
    標題: "定位只做情境啟動",
    說明:
      "定位用來判斷是否進入路口守護情境，不建立行蹤紀錄，也不傳送雲端。",
  },
  {
    標題: "動作資料只算步速",
    說明:
      "加速度計用於估算個人步速，讓每次判斷都能貼近使用者實際行走能力。",
  },
];

export default function Home() {
  return (
    <main className="網站頁面">
      <section className="主視覺">
        <div className="主視覺遮罩" />
        <nav className="導覽列" aria-label="主要導覽">
          <a className="品牌標記" href="#top" aria-label="AI 陪走夥伴首頁">
            AI 陪走夥伴
          </a>
          <div className="導覽連結">
            <a href="#pain-points">痛點</a>
            <a href="#app-demo">App 示意</a>
            <a href="#privacy">Edge AI</a>
          </div>
        </nav>

        <div className="主視覺內容" id="top">
          <p className="前導文字">AI Walk Buddy</p>
          <h1>AI 陪走夥伴</h1>
          <p className="主標副文">
            為高齡行人設計的零干擾過馬路守護 App。把「剩幾秒」換算成「我能不能安全通過」。
          </p>
          <div className="主視覺按鈕列" aria-label="頁面快速連結">
            <a className="主要連結" href="#app-demo">
              看 App 示意
            </a>
            <a className="次要連結" href="#pain-points">
              了解安全痛點
            </a>
          </div>
        </div>
      </section>

      <section className="痛點區塊" id="pain-points" aria-labelledby="痛點標題">
        <div className="區塊標題列">
          <p className="前導文字">為什麼需要它</p>
          <h2 id="痛點標題">不是長輩走得慢，是路口沒有替每個人留足判斷時間。</h2>
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
      </section>

      <section className="示意區塊" id="app-demo" aria-labelledby="示意標題">
        <div className="示意文字">
          <p className="前導文字">App 示意圖</p>
          <h2 id="示意標題">把複雜判斷壓縮成一眼看懂的紅與綠。</h2>
          <p>
            高齡使用者不需要操作地圖、輸入地址或閱讀小字。啟動守護後，畫面只回應一件事：
            現在是否有足夠時間過馬路。
          </p>
          <div className="公式盒">
            <span>安全穿越所需秒數</span>
            <strong>20m ÷ 0.8m/s = 25秒</strong>
          </div>
        </div>

        <div className="手機舞台" aria-label="AI 陪走夥伴 App 示意圖">
          <div className="手機外框 主要手機">
            <div className="手機聽筒" />
            <div className="手機畫面 綠燈畫面">
              <span className="狀態小字">綠燈剩 32 秒</span>
              <span className="巨大符號">✓</span>
              <strong>時間充足，安心通過</strong>
              <span className="秒數列">需要 25 秒</span>
            </div>
          </div>

          <div className="手機外框 警示手機">
            <div className="手機聽筒" />
            <div className="手機畫面 紅燈畫面">
              <span className="狀態小字">綠燈剩 12 秒</span>
              <span className="巨大符號">！</span>
              <strong>時間不夠，請退回！</strong>
              <span className="秒數列">急促震動提醒</span>
            </div>
          </div>
        </div>
      </section>

      <section className="隱私區塊" id="privacy" aria-labelledby="隱私標題">
        <div className="區塊標題列">
          <p className="前導文字">Edge AI 隱私優先</p>
          <h2 id="隱私標題">資料留在手機，判斷就在身邊完成。</h2>
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

      <section className="流程區塊" aria-labelledby="流程標題">
        <div>
          <p className="前導文字">MVP Demo 流程</p>
          <h2 id="流程標題">從測步速到過馬路提醒，五步完成守護。</h2>
        </div>
        <ol className="流程清單">
          {流程列表.map((流程, 索引) => (
            <li key={流程}>
              <span>{String(索引 + 1).padStart(2, "0")}</span>
              <strong>{流程}</strong>
            </li>
          ))}
        </ol>
      </section>

      <footer className="頁尾">
        <strong>AI 陪走夥伴</strong>
        <span>為高齡行人打造的本機 AI 過馬路守護 Demo</span>
      </footer>
    </main>
  );
}
