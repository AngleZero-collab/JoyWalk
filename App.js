import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { Accelerometer, Gyroscope, Pedometer } from 'expo-sensors';

const 分頁 = {
  首頁: '首頁',
  數據紀錄: '數據紀錄',
  寵物任務: '寵物任務',
  獎勵商店: '獎勵商店',
  家屬設定: '家屬設定',
};

const 通行狀態 = {
  收集中: '收集中',
  可以通過: '可以通過',
  暫停等待: '暫停等待',
};

const 加速度取樣毫秒 = 120;
const 陀螺儀取樣毫秒 = 120;
const 分析間隔毫秒 = 1200;
const 樣本上限 = 120;
const 預設斑馬線距離 = 20;
const 預設通行秒數 = 30;
const 預設步幅公尺 = 0.58;
const 初始點數 = 120;

const 初始步態 = {
  狀態: 通行狀態.收集中,
  主文字: '正在讀取步態',
  副文字: '請自然走幾步',
  步數: 0,
  步頻: 0,
  步速: 0,
  步行步長: 預設步幅公尺,
  雙腳支撐時間: 0,
  步態不對稱性: 0,
  步態穩定時間: 0,
  安全穿越秒數: 0,
  晃動指數: 0,
  旋轉晃動指數: 0,
  風險分數: 0,
  原始資料筆數: 0,
  更新時間: '現在',
};

const 每日趨勢 = [
  { 日期: '一', 步行步長: 0.54, 雙腳支撐時間: 31, 步態不對稱性: 2.8 },
  { 日期: '二', 步行步長: 0.56, 雙腳支撐時間: 29, 步態不對稱性: 2.3 },
  { 日期: '三', 步行步長: 0.59, 雙腳支撐時間: 27, 步態不對稱性: 1.9 },
  { 日期: '四', 步行步長: 0.57, 雙腳支撐時間: 28, 步態不對稱性: 2.0 },
  { 日期: '五', 步行步長: 0.6, 雙腳支撐時間: 26, 步態不對稱性: 1.6 },
  { 日期: '六', 步行步長: 0.58, 雙腳支撐時間: 25, 步態不對稱性: 1.5 },
  { 日期: '日', 步行步長: 0.61, 雙腳支撐時間: 24, 步態不對稱性: 1.4 },
];

const 商店道具 = [
  { 名稱: '暖心圍巾', 稀有度: '普通', 價格: 60, 說明: '讓寵物看起來更有精神。' },
  { 名稱: '反光背心', 稀有度: '稀有', 價格: 150, 說明: '象徵夜間步行安全。' },
  { 名稱: '亮晶晶守護徽章', 稀有度: '亮晶晶特效', 價格: 300, 說明: '限定特效道具。' },
];

const 抽卡池 = [
  { 名稱: '安心貼紙', 稀有度: '普通', 機率: 0.72 },
  { 名稱: '寵物小帽', 稀有度: '普通', 機率: 0.18 },
  { 名稱: '反光斗篷', 稀有度: '稀有', 機率: 0.08 },
  { 名稱: '亮晶晶護身符', 稀有度: '亮晶晶特效', 機率: 0.02 },
];

export default function App() {
  const [目前分頁, 設定目前分頁] = useState(分頁.首頁);
  const [步態, 設定步態] = useState(初始步態);
  const [感測器啟用, 設定感測器啟用] = useState(true);
  const [強震提醒, 設定強震提醒] = useState(true);
  const [緊急聯絡人, 設定緊急聯絡人] = useState('');
  const [基準步幅文字, 設定基準步幅文字] = useState(String(預設步幅公尺));
  const [點數, 設定點數] = useState(初始點數);
  const [最後獎勵, 設定最後獎勵] = useState(null);
  const [設定頁顯示, 設定設定頁顯示] = useState(false);
  const [今日任務, 設定今日任務] = useState([
    { 名稱: '完成 10 分鐘穩定步行', 進度: 0.48, 完成: false },
    { 名稱: '連續 3 天步態不對稱性 < 2%', 進度: 0.66, 完成: false },
    { 名稱: '今日通行判斷皆無高風險', 進度: 0.8, 完成: false },
  ]);

  const 加速度原始陣列 = useRef([]);
  const 陀螺儀原始陣列 = useRef([]);
  const 加速度訂閱 = useRef(null);
  const 陀螺儀訂閱 = useRef(null);
  const 計步訂閱 = useRef(null);
  const 分析計時器 = useRef(null);
  const 開始時間 = useRef(Date.now());
  const 累積步數 = useRef(0);
  const 上次狀態 = useRef(通行狀態.收集中);
  const 步態參考 = useRef(初始步態);
  const 強震提醒參考 = useRef(true);

  const 基準步幅 = useMemo(() => {
    const 數值 = Number.parseFloat(基準步幅文字);
    return Number.isFinite(數值) ? Math.max(0.35, Math.min(0.9, 數值)) : 預設步幅公尺;
  }, [基準步幅文字]);

  useEffect(() => {
    步態參考.current = 步態;
  }, [步態]);

  useEffect(() => {
    強震提醒參考.current = 強震提醒;
  }, [強震提醒]);

  useEffect(() => {
    if (!感測器啟用) {
      清除感測器();
      設定步態((目前) => ({
        ...目前,
        狀態: 通行狀態.收集中,
        主文字: '感測器已暫停',
        副文字: '請到家屬設定重新開啟',
      }));
      return undefined;
    }

    啟動感測器();

    return () => {
      清除感測器();
    };
  }, [感測器啟用]);

  function 發出語音提示(提示文字) {
    AccessibilityInfo.announceForAccessibility(提示文字);
  }

  function 清除感測器() {
    if (分析計時器.current) {
      clearInterval(分析計時器.current);
      分析計時器.current = null;
    }

    if (加速度訂閱.current) {
      加速度訂閱.current.remove();
      加速度訂閱.current = null;
    }

    if (陀螺儀訂閱.current) {
      陀螺儀訂閱.current.remove();
      陀螺儀訂閱.current = null;
    }

    if (計步訂閱.current) {
      計步訂閱.current.remove();
      計步訂閱.current = null;
    }

    加速度原始陣列.current = [];
    陀螺儀原始陣列.current = [];
    Vibration.cancel();
  }

  async function 啟動感測器() {
    清除感測器();
    開始時間.current = Date.now();
    累積步數.current = 0;

    try {
      await Accelerometer.requestPermissionsAsync();
      if (typeof Gyroscope.requestPermissionsAsync === 'function') {
        await Gyroscope.requestPermissionsAsync();
      }
      if (typeof Pedometer.requestPermissionsAsync === 'function') {
        await Pedometer.requestPermissionsAsync();
      }
    } catch (錯誤) {
      設定步態((目前) => ({
        ...目前,
        狀態: 通行狀態.暫停等待,
        主文字: '請允許感測器權限',
        副文字: '需要動作感測器才能判斷通行風險',
      }));
      return;
    }

    Accelerometer.setUpdateInterval(加速度取樣毫秒);
    Gyroscope.setUpdateInterval(陀螺儀取樣毫秒);

    加速度訂閱.current = Accelerometer.addListener((樣本) => {
      加速度原始陣列.current.push({ ...樣本, 時間: Date.now() });
      if (加速度原始陣列.current.length > 樣本上限) {
        加速度原始陣列.current.shift();
      }
    });

    陀螺儀訂閱.current = Gyroscope.addListener((樣本) => {
      陀螺儀原始陣列.current.push({ ...樣本, 時間: Date.now() });
      if (陀螺儀原始陣列.current.length > 樣本上限) {
        陀螺儀原始陣列.current.shift();
      }
    });

    const 計步器可用 = await Pedometer.isAvailableAsync();
    if (計步器可用) {
      計步訂閱.current = Pedometer.watchStepCount((結果) => {
        累積步數.current = 結果.steps;
      });
    }

    分析計時器.current = setInterval(() => {
      執行本機通行判斷();
    }, 分析間隔毫秒);

    執行本機通行判斷();
  }

  function 平均值(數列) {
    if (!數列.length) {
      return 0;
    }

    return 數列.reduce((總和, 數值) => 總和 + 數值, 0) / 數列.length;
  }

  function 標準差(數列) {
    if (數列.length < 2) {
      return 0;
    }

    const 平均 = 平均值(數列);
    return Math.sqrt(平均值(數列.map((數值) => Math.pow(數值 - 平均, 2))));
  }

  function 估算峰值步頻(加速度樣本, 秒數) {
    if (加速度樣本.length < 8 || 秒數 <= 0) {
      return 0;
    }

    let 峰值數 = 0;
    for (let 索引 = 1; 索引 < 加速度樣本.length - 1; 索引 += 1) {
      const 前 = 加速度樣本[索引 - 1].合成;
      const 中 = 加速度樣本[索引].合成;
      const 後 = 加速度樣本[索引 + 1].合成;
      if (中 > 前 && 中 > 後 && 中 > 1.06) {
        峰值數 += 1;
      }
    }

    return (峰值數 / 秒數) * 60;
  }

  function 呼叫原生步態模型預留介面(加速度樣本, 陀螺儀樣本) {
    // JNI / NDK / FFI 擴充點：
    // 後續可把下方 JavaScript 陣列轉成 Float32Array，再交給 C/C++ 進行高效率步態判斷。
    // 目前 MVP 回傳 null，代表使用 JavaScript 本機演算法；資料不會離開手機。
    void 加速度樣本;
    void 陀螺儀樣本;
    return null;
  }

  function 執行本機通行判斷() {
    const 加速度快照 = 加速度原始陣列.current.map(({ x, y, z, 時間 }) => ({
      x,
      y,
      z,
      時間,
      合成: Math.sqrt(x * x + y * y + z * z),
    }));
    const 陀螺儀快照 = 陀螺儀原始陣列.current.map(({ x, y, z, 時間 }) => ({
      x,
      y,
      z,
      時間,
      合成: Math.sqrt(x * x + y * y + z * z),
    }));

    // 隱私優先：取得運算快照後，立即清空原始陣列，避免感測器原始資料長時間留在記憶體。
    加速度原始陣列.current = [];
    陀螺儀原始陣列.current = [];

    呼叫原生步態模型預留介面(加速度快照, 陀螺儀快照);

    const 經過秒數 = Math.max((Date.now() - 開始時間.current) / 1000, 1);
    const 目前步數 = 累積步數.current;
    const 步頻 = 目前步數 > 0
      ? (目前步數 / 經過秒數) * 60
      : 估算峰值步頻(加速度快照, 分析間隔毫秒 / 1000);
    const 加速度晃動 = 標準差(加速度快照.map((樣本) => 樣本.合成));
    const 旋轉晃動 = 標準差(陀螺儀快照.map((樣本) => 樣本.合成));
    const 步速 = Math.max(0, (步頻 * 基準步幅) / 60);
    const 步行步長 = Math.max(0.35, Math.min(0.9, 基準步幅 * (0.88 + Math.min(0.24, 步頻 / 500))));
    const 雙腳支撐時間 = Math.max(18, Math.min(48, 34 + 加速度晃動 * 18 - 步速 * 8));
    const 步態不對稱性 = Math.max(0.5, Math.min(12, 1.2 + 旋轉晃動 * 8 + Math.max(0, 0.5 - 步速) * 5));
    const 安全穿越秒數 = 預設斑馬線距離 / Math.max(步速, 0.15);
    const 步速驟降風險 = 步速 < 0.35 ? 30 : 0;
    const 晃動異常風險 = Math.min(30, 加速度晃動 * 24 + 旋轉晃動 * 18);
    const 支撐過高風險 = 雙腳支撐時間 > 34 ? 14 : 0;
    const 不對稱風險 = 步態不對稱性 > 4 ? 18 : 0;
    const 時間不足風險 = 安全穿越秒數 > 預設通行秒數 ? 28 : 0;
    const 風險分數 = Math.round(
      Math.min(100, 步速驟降風險 + 晃動異常風險 + 支撐過高風險 + 不對稱風險 + 時間不足風險),
    );
    const 可以通過 = 風險分數 < 45 && 安全穿越秒數 <= 預設通行秒數 && 步頻 >= 18;
    const 下一狀態 = 可以通過 ? 通行狀態.可以通過 : 通行狀態.暫停等待;

    const 下一步態 = {
      狀態: 下一狀態,
      主文字: 可以通過 ? '可以通過' : '請先停下',
      副文字: 可以通過
        ? '步態穩定，預估可在安全時間內通過'
        : '偵測到步態風險，建議退回等待',
      步數: 目前步數,
      步頻,
      步速,
      步行步長,
      雙腳支撐時間,
      步態不對稱性,
      步態穩定時間: 可以通過 ? Math.round(經過秒數) : 步態參考.current.步態穩定時間,
      安全穿越秒數,
      晃動指數: 加速度晃動,
      旋轉晃動指數: 旋轉晃動,
      風險分數,
      原始資料筆數: 加速度快照.length + 陀螺儀快照.length,
      更新時間: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    };

    步態參考.current = 下一步態;
    設定步態(下一步態);
    更新任務(下一步態);
    觸發通行提醒(下一步態);
  }

  function 更新任務(本次步態) {
    設定今日任務((任務列表) =>
      任務列表.map((任務, 索引) => {
        const 新進度 = 索引 === 0
          ? Math.min(1, 本次步態.步態穩定時間 / 600)
          : 索引 === 1
            ? Math.min(1, 本次步態.步態不對稱性 < 2 ? 任務.進度 + 0.05 : 任務.進度)
            : Math.min(1, 本次步態.風險分數 < 45 ? 任務.進度 + 0.04 : 任務.進度);
        const 剛完成 = !任務.完成 && 新進度 >= 1;
        if (剛完成) {
          設定點數((目前點數) => 目前點數 + 40);
        }
        return { ...任務, 進度: 新進度, 完成: 任務.完成 || 剛完成 };
      }),
    );
  }

  function 觸發通行提醒(本次步態) {
    if (本次步態.狀態 === 上次狀態.current) {
      return;
    }

    Vibration.cancel();

    if (本次步態.狀態 === 通行狀態.可以通過) {
      Vibration.vibrate(160);
      發出語音提示('可以通過，請保持穩定步伐。');
    }

    if (本次步態.狀態 === 通行狀態.暫停等待) {
      Vibration.vibrate(強震提醒參考.current ? [0, 450, 180, 450, 180, 650] : [0, 300, 150, 300]);
      發出語音提示('請先停下，偵測到步態風險。');
    }

    上次狀態.current = 本次步態.狀態;
  }

  function 執行盲盒抽卡() {
    const 抽卡費用 = 30;
    if (點數 < 抽卡費用) {
      設定最後獎勵({ 名稱: '點數不足', 稀有度: '提醒', 說明: '完成每日任務可以獲得更多點數。' });
      return;
    }

    設定點數((目前點數) => 目前點數 - 抽卡費用);
    const 隨機值 = Math.random();
    let 累積機率 = 0;
    const 抽中 = 抽卡池.find((道具) => {
      累積機率 += 道具.機率;
      return 隨機值 <= 累積機率;
    }) ?? 抽卡池[0];

    設定最後獎勵({
      ...抽中,
      說明: `RNG ${隨機值.toFixed(4)}｜${抽中.稀有度} 道具`,
    });
  }

  function 兌換道具(道具) {
    if (點數 < 道具.價格) {
      設定最後獎勵({ 名稱: '點數不足', 稀有度: '提醒', 說明: `還需要 ${道具.價格 - 點數} 點。` });
      return;
    }

    設定點數((目前點數) => 目前點數 - 道具.價格);
    設定最後獎勵({ ...道具, 說明: `已兌換：${道具.說明}` });
  }

  function 顯示設定頁() {
    設定設定頁顯示(true);
    設定目前分頁(分頁.家屬設定);
  }

  const 狀態顏色 = 步態.狀態 === 通行狀態.可以通過 ? '#008000' : '#FF0000';
  const 狀態符號 = 步態.狀態 === 通行狀態.可以通過 ? '✓' : '!';

  return (
    <SafeAreaView style={樣式.應用容器}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={樣式.頂部列}>
        <Pressable
          accessibilityLabel="長按開啟家屬設定"
          onLongPress={顯示設定頁}
          delayLongPress={900}
          style={樣式.品牌區}
        >
          <Text style={樣式.品牌文字}>SafeStride 安行</Text>
          <Text style={樣式.品牌副標}>高齡行人過馬路防護與步態分析</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="長按開啟家屬設定"
          onLongPress={顯示設定頁}
          delayLongPress={900}
          style={樣式.設定角落}
        >
          <Text style={樣式.設定角落文字}>家屬</Text>
        </Pressable>
      </View>

      {目前分頁 === 分頁.首頁 && <首頁畫面 步態={步態} 狀態顏色={狀態顏色} 狀態符號={狀態符號} />}
      {目前分頁 === 分頁.數據紀錄 && <數據紀錄畫面 步態={步態} />}
      {目前分頁 === 分頁.寵物任務 && <寵物任務畫面 今日任務={今日任務} 步態={步態} 點數={點數} />}
      {目前分頁 === 分頁.獎勵商店 && (
        <獎勵商店畫面
          點數={點數}
          最後獎勵={最後獎勵}
          on抽卡={執行盲盒抽卡}
          on兌換={兌換道具}
        />
      )}
      {目前分頁 === 分頁.家屬設定 && 設定頁顯示 && (
        <家屬設定畫面
          感測器啟用={感測器啟用}
          強震提醒={強震提醒}
          緊急聯絡人={緊急聯絡人}
          基準步幅文字={基準步幅文字}
          on感測器切換={設定感測器啟用}
          on強震切換={設定強震提醒}
          on聯絡人變更={設定緊急聯絡人}
          on步幅變更={設定基準步幅文字}
          on關閉={() => {
            設定設定頁顯示(false);
            設定目前分頁(分頁.首頁);
          }}
        />
      )}

      <View style={樣式.底部導覽列}>
        <導覽按鈕 標籤="防護" 圖示="✓" 啟用={目前分頁 === 分頁.首頁} onPress={() => 設定目前分頁(分頁.首頁)} />
        <導覽按鈕 標籤="數據" 圖示="▥" 啟用={目前分頁 === 分頁.數據紀錄} onPress={() => 設定目前分頁(分頁.數據紀錄)} />
        <導覽按鈕 標籤="任務" 圖示="★" 啟用={目前分頁 === 分頁.寵物任務} onPress={() => 設定目前分頁(分頁.寵物任務)} />
        <導覽按鈕 標籤="商店" 圖示="◇" 啟用={目前分頁 === 分頁.獎勵商店} onPress={() => 設定目前分頁(分頁.獎勵商店)} />
      </View>
    </SafeAreaView>
  );
}

function 首頁畫面({ 步態, 狀態顏色, 狀態符號 }) {
  return (
    <View style={[樣式.首頁, { backgroundColor: 狀態顏色 }]}>
      <Text style={樣式.首頁符號}>{狀態符號}</Text>
      <Text style={樣式.首頁主文字}>{步態.主文字}</Text>
      <Text style={樣式.首頁副文字}>{步態.副文字}</Text>
      <View style={樣式.首頁資料列}>
        <狀態膠囊 標籤="預估穿越" 數值={`${步態.安全穿越秒數.toFixed(0)} 秒`} />
        <狀態膠囊 標籤="風險分數" 數值={`${步態.風險分數}/100`} />
        <狀態膠囊 標籤="步速" 數值={`${步態.步速.toFixed(2)} m/s`} />
      </View>
      <Text style={樣式.首頁隱私文字}>僅用本機加速度計與陀螺儀，即時運算後銷毀原始資料</Text>
    </View>
  );
}

function 數據紀錄畫面({ 步態 }) {
  return (
    <ScrollView style={樣式.頁面捲動} contentContainerStyle={樣式.捲動內容}>
      <Text style={樣式.頁面標題}>所有健康資料</Text>
      <View style={樣式.健康卡片}>
        <Text style={樣式.健康卡片標題}>步行步長</Text>
        <Text style={樣式.健康數值}>{(步態.步行步長 * 39.37).toFixed(1)}<Text style={樣式.健康單位}> 英吋</Text></Text>
        <迷你長條圖 數值列表={每日趨勢.map((項目) => 項目.步行步長)} 最大值={0.8} 顏色="#ff7a1a" />
      </View>
      <View style={樣式.健康卡片}>
        <Text style={樣式.健康卡片標題}>步行速度</Text>
        <Text style={樣式.健康數值}>{(步態.步速 * 3.6).toFixed(1)}<Text style={樣式.健康單位}> 公里/小時</Text></Text>
        <迷你長條圖 數值列表={[0.4, 0.52, 0.61, 0.58, 0.66, 0.7, 步態.步速]} 最大值={1.2} 顏色="#ff7a1a" />
      </View>
      <View style={樣式.健康卡片}>
        <Text style={樣式.健康卡片標題}>雙腳支撐時間</Text>
        <Text style={樣式.健康數值}>{步態.雙腳支撐時間.toFixed(1)}<Text style={樣式.健康單位}> %</Text></Text>
        <迷你長條圖 數值列表={每日趨勢.map((項目) => 項目.雙腳支撐時間)} 最大值={50} 顏色="#ff7a1a" />
      </View>
      <View style={樣式.健康卡片}>
        <Text style={樣式.健康卡片標題}>步態不對稱性</Text>
        <Text style={樣式.健康數值}>{步態.步態不對稱性.toFixed(1)}<Text style={樣式.健康單位}> %</Text></Text>
        <迷你長條圖 數值列表={每日趨勢.map((項目) => 項目.步態不對稱性)} 最大值={8} 顏色="#ff7a1a" />
      </View>
      <View style={樣式.說明卡片}>
        <Text style={樣式.說明標題}>本機進階資料轉換</Text>
        <Text style={樣式.說明文字}>
          App 將原始感測器資料轉換成步長、雙腳支撐時間與不對稱性等進階指標。此版本為健康風險提醒 MVP，不取代醫師診斷。
        </Text>
      </View>
    </ScrollView>
  );
}

function 寵物任務畫面({ 今日任務, 步態, 點數 }) {
  const 寵物狀態 = 步態.狀態 === 通行狀態.可以通過 ? '開心守護中' : '提醒你先停下';
  return (
    <ScrollView style={樣式.頁面捲動} contentContainerStyle={樣式.捲動內容}>
      <Text style={樣式.頁面標題}>虛擬寵物與任務</Text>
      <View style={樣式.寵物卡片}>
        <Text style={樣式.寵物圖示}>●</Text>
        <Text style={樣式.寵物名稱}>安行夥伴</Text>
        <Text style={樣式.寵物狀態}>{寵物狀態}</Text>
        <Text style={樣式.點數文字}>目前點數 {點數} 點</Text>
      </View>
      {今日任務.map((任務) => (
        <View style={樣式.任務卡片} key={任務.名稱}>
          <Text style={樣式.任務名稱}>{任務.完成 ? '已完成：' : ''}{任務.名稱}</Text>
          <View style={樣式.任務進度軌}>
            <View style={[樣式.任務進度條, { width: `${Math.round(任務.進度 * 100)}%` }]} />
          </View>
          <Text style={樣式.任務進度文字}>{Math.round(任務.進度 * 100)}%</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function 獎勵商店畫面({ 點數, 最後獎勵, on抽卡, on兌換 }) {
  return (
    <ScrollView style={樣式.頁面捲動} contentContainerStyle={樣式.捲動內容}>
      <Text style={樣式.頁面標題}>獎勵商店</Text>
      <Text style={樣式.點數文字深色}>可用點數：{點數}</Text>
      <Pressable style={樣式.抽卡按鈕} onPress={on抽卡}>
        <Text style={樣式.抽卡文字}>盲盒抽一次｜30 點</Text>
        <Text style={樣式.抽卡副文字}>普通 90%｜稀有 8%｜亮晶晶 2%</Text>
      </Pressable>
      {最後獎勵 && (
        <View style={樣式.獎勵結果}>
          <Text style={樣式.獎勵稀有度}>{最後獎勵.稀有度}</Text>
          <Text style={樣式.獎勵名稱}>{最後獎勵.名稱}</Text>
          <Text style={樣式.說明文字}>{最後獎勵.說明}</Text>
        </View>
      )}
      {商店道具.map((道具) => (
        <View style={樣式.商店卡片} key={道具.名稱}>
          <View>
            <Text style={樣式.商店名稱}>{道具.名稱}</Text>
            <Text style={樣式.商店說明}>{道具.稀有度}｜{道具.說明}</Text>
          </View>
          <Pressable style={樣式.兌換按鈕} onPress={() => on兌換(道具)}>
            <Text style={樣式.兌換文字}>{道具.價格} 點</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function 家屬設定畫面({
  感測器啟用,
  強震提醒,
  緊急聯絡人,
  基準步幅文字,
  on感測器切換,
  on強震切換,
  on聯絡人變更,
  on步幅變更,
  on關閉,
}) {
  return (
    <ScrollView style={樣式.頁面捲動} contentContainerStyle={樣式.捲動內容}>
      <Text style={樣式.頁面標題}>家屬專用設定</Text>
      <Text style={樣式.設定提示}>此頁由右上角「家屬」長按開啟，避免長輩誤觸。</Text>
      <設定列 標題="啟用本機感測器" 說明="讀取加速度計、陀螺儀與計步器" 值={感測器啟用} onValueChange={on感測器切換} />
      <設定列 標題="危險時強震提醒" 說明="步速驟降或晃動異常時啟動急促震動" 值={強震提醒} onValueChange={on強震切換} />
      <Text style={樣式.輸入標籤}>SOS 緊急聯絡人</Text>
      <TextInput
        value={緊急聯絡人}
        onChangeText={on聯絡人變更}
        keyboardType="phone-pad"
        placeholder="例如 0912-345-678"
        placeholderTextColor="#7a7a7a"
        style={樣式.文字輸入}
      />
      <Text style={樣式.輸入標籤}>長輩初始步幅基準值（公尺）</Text>
      <TextInput
        value={基準步幅文字}
        onChangeText={on步幅變更}
        keyboardType="decimal-pad"
        placeholder="0.58"
        placeholderTextColor="#7a7a7a"
        style={樣式.文字輸入}
      />
      <View style={樣式.隱私宣告卡片}>
        <Text style={樣式.說明標題}>本機運算隱私宣告</Text>
        <Text style={樣式.說明文字}>
          所有加速度計、陀螺儀與步數資料只在手機本機端運算。每次分析後立即清空記憶體內原始陣列，不上傳雲端。後續 JNI / NDK / FFI 演算法也必須維持同樣原則。
        </Text>
      </View>
      <Pressable style={樣式.關閉設定按鈕} onPress={on關閉}>
        <Text style={樣式.關閉設定文字}>完成設定</Text>
      </Pressable>
    </ScrollView>
  );
}

function 導覽按鈕({ 標籤, 圖示, 啟用, onPress }) {
  return (
    <Pressable style={[樣式.導覽按鈕, 啟用 && 樣式.導覽按鈕啟用]} onPress={onPress}>
      <Text style={[樣式.導覽圖示, 啟用 && 樣式.導覽文字啟用]}>{圖示}</Text>
      <Text style={[樣式.導覽文字, 啟用 && 樣式.導覽文字啟用]}>{標籤}</Text>
    </Pressable>
  );
}

function 狀態膠囊({ 標籤, 數值 }) {
  return (
    <View style={樣式.狀態膠囊}>
      <Text style={樣式.狀態膠囊標籤}>{標籤}</Text>
      <Text style={樣式.狀態膠囊數值}>{數值}</Text>
    </View>
  );
}

function 迷你長條圖({ 數值列表, 最大值, 顏色 }) {
  return (
    <View style={樣式.長條圖}>
      {數值列表.map((數值, 索引) => (
        <View key={`${數值}-${索引}`} style={樣式.長條外框}>
          <View
            style={[
              樣式.長條,
              {
                height: `${Math.max(12, Math.min(100, (數值 / 最大值) * 100))}%`,
                backgroundColor: 索引 === 數值列表.length - 1 ? 顏色 : '#e2e3e8',
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

function 設定列({ 標題, 說明, 值, onValueChange }) {
  return (
    <View style={樣式.設定列}>
      <View style={樣式.設定列文字區}>
        <Text style={樣式.設定列標題}>{標題}</Text>
        <Text style={樣式.設定列說明}>{說明}</Text>
      </View>
      <Switch value={值} onValueChange={onValueChange} />
    </View>
  );
}

const 樣式 = StyleSheet.create({
  應用容器: {
    flex: 1,
    backgroundColor: '#000000',
  },
  頂部列: {
    minHeight: 78,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  品牌區: {
    flex: 1,
    paddingRight: 12,
  },
  品牌文字: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  品牌副標: {
    color: '#D6D6D6',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  設定角落: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  設定角落文字: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  首頁: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 112,
  },
  首頁符號: {
    color: '#FFFFFF',
    fontSize: 170,
    fontWeight: '900',
    lineHeight: 178,
  },
  首頁主文字: {
    color: '#FFFFFF',
    fontSize: 58,
    fontWeight: '900',
    lineHeight: 68,
    textAlign: 'center',
  },
  首頁副文字: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 36,
    marginTop: 14,
    textAlign: 'center',
  },
  首頁資料列: {
    gap: 10,
    marginTop: 28,
    width: '100%',
  },
  狀態膠囊: {
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.26)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  狀態膠囊標籤: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  狀態膠囊數值: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  首頁隱私文字: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 24,
    marginTop: 20,
    opacity: 0.9,
    textAlign: 'center',
  },
  頁面捲動: {
    flex: 1,
    backgroundColor: '#F1F1F6',
  },
  捲動內容: {
    padding: 22,
    paddingBottom: 130,
  },
  頁面標題: {
    color: '#000000',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 48,
    marginBottom: 22,
  },
  健康卡片: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginBottom: 16,
    minHeight: 168,
    padding: 24,
  },
  健康卡片標題: {
    color: '#FF6D1A',
    fontSize: 25,
    fontWeight: '900',
  },
  健康數值: {
    color: '#000000',
    fontSize: 52,
    fontWeight: '900',
    marginTop: 28,
  },
  健康單位: {
    color: '#8A8A8E',
    fontSize: 24,
    fontWeight: '900',
  },
  長條圖: {
    position: 'absolute',
    right: 22,
    bottom: 28,
    height: 82,
    width: 170,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: 8,
  },
  長條外框: {
    width: 16,
    height: 82,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  長條: {
    width: 16,
    borderRadius: 999,
  },
  說明卡片: {
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 22,
  },
  說明標題: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
  },
  說明文字: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 25,
  },
  寵物卡片: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginBottom: 18,
    padding: 28,
  },
  寵物圖示: {
    fontSize: 78,
  },
  寵物名稱: {
    color: '#000000',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8,
  },
  寵物狀態: {
    color: '#555555',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  點數文字: {
    color: '#008000',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 12,
  },
  點數文字深色: {
    color: '#008000',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 18,
  },
  任務卡片: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 14,
    padding: 20,
  },
  任務名稱: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
  },
  任務進度軌: {
    height: 14,
    backgroundColor: '#E7E7EC',
    borderRadius: 999,
    marginTop: 14,
    overflow: 'hidden',
  },
  任務進度條: {
    height: '100%',
    backgroundColor: '#008000',
  },
  任務進度文字: {
    color: '#6B6B70',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  抽卡按鈕: {
    backgroundColor: '#111111',
    borderRadius: 18,
    marginBottom: 16,
    padding: 22,
  },
  抽卡文字: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  抽卡副文字: {
    color: '#FFD43B',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
  },
  獎勵結果: {
    backgroundColor: '#FFF7D6',
    borderRadius: 18,
    marginBottom: 16,
    padding: 20,
  },
  獎勵稀有度: {
    color: '#9B6200',
    fontSize: 16,
    fontWeight: '900',
  },
  獎勵名稱: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 8,
  },
  商店卡片: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 18,
  },
  商店名稱: {
    color: '#000000',
    fontSize: 21,
    fontWeight: '900',
  },
  商店說明: {
    color: '#666666',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 4,
    maxWidth: 210,
  },
  兌換按鈕: {
    backgroundColor: '#008000',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  兌換文字: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  設定提示: {
    color: '#555555',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 18,
  },
  設定列: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 18,
  },
  設定列文字區: {
    flex: 1,
    paddingRight: 12,
  },
  設定列標題: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '900',
  },
  設定列說明: {
    color: '#666666',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 4,
  },
  輸入標籤: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
    marginTop: 14,
  },
  文字輸入: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    color: '#000000',
    fontSize: 22,
    fontWeight: '800',
    minHeight: 60,
    paddingHorizontal: 18,
  },
  隱私宣告卡片: {
    backgroundColor: '#111111',
    borderRadius: 18,
    marginTop: 18,
    padding: 20,
  },
  關閉設定按鈕: {
    alignItems: 'center',
    backgroundColor: '#008000',
    borderRadius: 12,
    marginTop: 18,
    minHeight: 58,
    justifyContent: 'center',
  },
  關閉設定文字: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  底部導覽列: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    minHeight: 76,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 22,
    flexDirection: 'row',
    padding: 8,
  },
  導覽按鈕: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
  },
  導覽按鈕啟用: {
    backgroundColor: '#111111',
  },
  導覽圖示: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '900',
  },
  導覽文字: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  導覽文字啟用: {
    color: '#FFFFFF',
  },
});
