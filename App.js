import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { Accelerometer, Pedometer } from 'expo-sensors';

const 畫面 = {
  設定步速: '設定步速',
  首頁待機: '首頁待機',
  步行守護: '步行守護',
};

const 分析狀態 = {
  收集中: '收集中',
  步態穩定: '步態穩定',
  建議休息: '建議休息',
};

const 語音提示文字 = {
  步速測量完成: '步速測量完成',
  守護模式啟動: '步行分析已啟動',
  請允許動作感測器: '請允許動作感測器權限',
  已結束散步: '已結束散步',
  步態穩定: '步態穩定，安心前進',
  建議休息: '步態不穩，請先停下休息',
};

const 預設平均步速 = 0.8;
const 分析間隔毫秒 = 3000;
const 加速度取樣毫秒 = 250;
const 最大樣本數 = 96;

const 初始行走分析 = {
  狀態: 分析狀態.收集中,
  主文字: '正在收集步行資料',
  說明文字: '請自然走幾步',
  步數: 0,
  步頻: 0,
  即時步速: 0,
  穩定分數: 0,
  晃動指數: 0,
  資料來源: '手機動作感測器',
};

export default function App() {
  const [目前畫面, 設定目前畫面] = useState(畫面.設定步速);
  const [平均步速, 設定平均步速] = useState(null);
  const [正在測量步速, 設定正在測量步速] = useState(false);
  const [正在啟動守護, 設定正在啟動守護] = useState(false);
  const [加速度取樣次數, 設定加速度取樣次數] = useState(0);
  const [測量步數, 設定測量步數] = useState(0);
  const [行走分析, 設定行走分析] = useState(初始行走分析);
  const [權限提示, 設定權限提示] = useState('');

  const 步速計時器 = useRef(null);
  const 分析計時器 = useRef(null);
  const 測量加速度訂閱 = useRef(null);
  const 測量計步訂閱 = useRef(null);
  const 守護加速度訂閱 = useRef(null);
  const 守護計步訂閱 = useRef(null);
  const 守護開始時間 = useRef(null);
  const 守護步數 = useRef(0);
  const 加速度樣本 = useRef([]);
  const 上次分析狀態 = useRef(分析狀態.收集中);

  useEffect(() => {
    return () => {
      清除步速測量資源();
      清除守護資源();
    };
  }, []);

  useEffect(() => {
    if (目前畫面 !== 畫面.步行守護) {
      return;
    }

    執行本機步行分析();
    分析計時器.current = setInterval(執行本機步行分析, 分析間隔毫秒);

    return () => {
      清除守護資源();
    };
  }, [目前畫面, 平均步速]);

  function 清除步速測量資源() {
    if (步速計時器.current) {
      clearTimeout(步速計時器.current);
      步速計時器.current = null;
    }

    if (測量加速度訂閱.current) {
      測量加速度訂閱.current.remove();
      測量加速度訂閱.current = null;
    }

    if (測量計步訂閱.current) {
      測量計步訂閱.current.remove();
      測量計步訂閱.current = null;
    }
  }

  function 清除守護資源() {
    if (分析計時器.current) {
      clearInterval(分析計時器.current);
      分析計時器.current = null;
    }

    if (守護加速度訂閱.current) {
      守護加速度訂閱.current.remove();
      守護加速度訂閱.current = null;
    }

    if (守護計步訂閱.current) {
      守護計步訂閱.current.remove();
      守護計步訂閱.current = null;
    }

    守護開始時間.current = null;
    守護步數.current = 0;
    加速度樣本.current = [];
    Vibration.cancel();
  }

  function 發出語音提示(提示文字) {
    // 使用系統螢幕閱讀器做本機語音提示；文字不會送到雲端服務。
    AccessibilityInfo.announceForAccessibility(提示文字);
  }

  async function 請求步行感測權限() {
    try {
      const 加速度權限 = await Accelerometer.requestPermissionsAsync();

      if (!加速度權限.granted) {
        設定權限提示('請允許動作感測器，才能分析步行狀態。');
        發出語音提示(語音提示文字.請允許動作感測器);
        return false;
      }

      const 計步器可用 = await Pedometer.isAvailableAsync();

      if (!計步器可用) {
        設定權限提示('此手機未提供計步器，將改用加速度資料估算步頻。');
        return true;
      }

      if (typeof Pedometer.requestPermissionsAsync === 'function') {
        const 計步器權限 = await Pedometer.requestPermissionsAsync();

        if (!計步器權限.granted) {
          設定權限提示('未允許活動辨識，將改用加速度資料估算步頻。');
        }
      }

      return true;
    } catch (錯誤) {
      設定權限提示('無法啟動手機感測器，請確認權限後再試一次。');
      return false;
    }
  }

  async function 開始測量步速() {
    設定權限提示('');
    設定正在測量步速(true);
    設定加速度取樣次數(0);
    設定測量步數(0);

    try {
      const 可以讀取感測器 = await 請求步行感測權限();

      if (可以讀取感測器) {
        Accelerometer.setUpdateInterval(加速度取樣毫秒);
        測量加速度訂閱.current = Accelerometer.addListener(() => {
          // Demo 先模擬收集三秒步行資料；正式版可用步頻、步幅與行走穩定度估算個人化步速。
          設定加速度取樣次數((目前次數) => 目前次數 + 1);
        });

        const 計步器可用 = await Pedometer.isAvailableAsync();

        if (計步器可用) {
          測量計步訂閱.current = Pedometer.watchStepCount((結果) => {
            設定測量步數(結果.steps);
          });
        }
      }
    } catch (錯誤) {
      設定權限提示('感測器讀取失敗，將使用示範步速。');
    }

    步速計時器.current = setTimeout(() => {
      清除步速測量資源();
      設定平均步速(預設平均步速);
      設定正在測量步速(false);
      發出語音提示(語音提示文字.步速測量完成);
      設定目前畫面(畫面.首頁待機);
    }, 3000);
  }

  async function 開始步行守護() {
    設定權限提示('');
    設定正在啟動守護(true);

    try {
      const 可以讀取感測器 = await 請求步行感測權限();

      if (!可以讀取感測器) {
        return;
      }

      啟動守護感測器();
      設定行走分析(初始行走分析);
      上次分析狀態.current = 分析狀態.收集中;
      發出語音提示(語音提示文字.守護模式啟動);
      設定目前畫面(畫面.步行守護);
    } catch (錯誤) {
      設定權限提示('啟動步行分析失敗，請確認手機動作感測器權限。');
    } finally {
      設定正在啟動守護(false);
    }
  }

  async function 啟動守護感測器() {
    清除守護資源();
    守護開始時間.current = Date.now();
    守護步數.current = 0;
    加速度樣本.current = [];

    Accelerometer.setUpdateInterval(加速度取樣毫秒);
    守護加速度訂閱.current = Accelerometer.addListener(({ x, y, z }) => {
      const 合成加速度 = Math.sqrt(x * x + y * y + z * z);
      加速度樣本.current = [
        ...加速度樣本.current,
        { 時間: Date.now(), 合成加速度 },
      ].slice(-最大樣本數);
    });

    const 計步器可用 = await Pedometer.isAvailableAsync();

    if (計步器可用) {
      守護計步訂閱.current = Pedometer.watchStepCount((結果) => {
        守護步數.current = 結果.steps;
      });
    }
  }

  function 結束散步() {
    清除守護資源();
    設定行走分析(初始行走分析);
    設定正在啟動守護(false);
    發出語音提示(語音提示文字.已結束散步);
    設定目前畫面(畫面.首頁待機);
  }

  function 計算標準差(數列) {
    if (數列.length < 2) {
      return 0;
    }

    const 平均值 = 數列.reduce((總和, 數值) => 總和 + 數值, 0) / 數列.length;
    const 變異量 =
      數列.reduce((總和, 數值) => 總和 + Math.pow(數值 - 平均值, 2), 0) /
      數列.length;

    return Math.sqrt(變異量);
  }

  function 由加速度估算步頻(樣本, 經過秒數) {
    if (樣本.length < 6 || 經過秒數 <= 0) {
      return 0;
    }

    let 峰值數量 = 0;

    for (let 索引 = 1; 索引 < 樣本.length - 1; 索引 += 1) {
      const 前一筆 = 樣本[索引 - 1].合成加速度;
      const 目前筆 = 樣本[索引].合成加速度;
      const 後一筆 = 樣本[索引 + 1].合成加速度;

      if (目前筆 > 前一筆 && 目前筆 > 後一筆 && 目前筆 > 1.08) {
        峰值數量 += 1;
      }
    }

    return (峰值數量 / 經過秒數) * 60;
  }

  function 產生步行建議({ 步頻, 即時步速, 穩定分數 }) {
    // 本地端決策規則：只用手機端步數、步頻、加速度晃動與個人平均步速做分析。
    // 目前版本不讀取攝像頭、不辨識號誌、不上傳任何影像或個人行走資料。
    if (步頻 < 15 && 即時步速 < 0.2) {
      return {
        狀態: 分析狀態.建議休息,
        主文字: '偵測到停下，請先確認路況',
        說明文字: '目前沒有穩定步行資料',
      };
    }

    if (即時步速 >= 0.45 && 穩定分數 >= 60) {
      return {
        狀態: 分析狀態.步態穩定,
        主文字: '步態穩定，安心前進',
        說明文字: '手機感測器顯示步伐穩定',
      };
    }

    return {
      狀態: 分析狀態.建議休息,
      主文字: '步態不穩，請先停下休息',
      說明文字: '建議放慢、扶穩或等待陪同行人',
    };
  }

  function 觸發分析震動(本次狀態) {
    if (本次狀態 === 上次分析狀態.current) {
      return;
    }

    Vibration.cancel();

    if (本次狀態 === 分析狀態.步態穩定) {
      Vibration.vibrate();
      發出語音提示(語音提示文字.步態穩定);
    }

    if (本次狀態 === 分析狀態.建議休息) {
      Vibration.vibrate([500, 300, 500]);
      發出語音提示(語音提示文字.建議休息);
    }

    上次分析狀態.current = 本次狀態;
  }

  function 執行本機步行分析() {
    const 開始時間 = 守護開始時間.current ?? Date.now();
    const 經過秒數 = Math.max((Date.now() - 開始時間) / 1000, 1);
    const 目前樣本 = 加速度樣本.current;
    const 目前步數 = 守護步數.current;
    const 晃動指數 = 計算標準差(目前樣本.map((樣本) => 樣本.合成加速度));
    const 計步器步頻 = 目前步數 > 0 ? (目前步數 / 經過秒數) * 60 : 0;
    const 加速度步頻 = 由加速度估算步頻(目前樣本, Math.min(經過秒數, 分析間隔毫秒 / 1000));
    const 步頻 = 計步器步頻 || 加速度步頻;
    const 推估步幅 = Math.max(0.35, Math.min(0.75, (平均步速 ?? 預設平均步速) / 1.6));
    const 即時步速 = (步頻 * 推估步幅) / 60;
    const 晃動扣分 = Math.min(45, Math.max(0, (晃動指數 - 0.45) * 85));
    const 過慢扣分 = 即時步速 < 0.45 ? 35 : 0;
    const 過快扣分 = 步頻 > 130 ? 18 : 0;
    const 穩定分數 = Math.round(
      Math.max(0, Math.min(100, 100 - 晃動扣分 - 過慢扣分 - 過快扣分)),
    );

    if (目前樣本.length < 4 && 目前步數 === 0) {
      設定行走分析(初始行走分析);
      return;
    }

    const 建議 = 產生步行建議({ 步頻, 即時步速, 穩定分數 });
    const 本次分析 = {
      ...建議,
      步數: 目前步數,
      步頻,
      即時步速,
      穩定分數,
      晃動指數,
      資料來源: 目前步數 > 0 ? '手機計步器' : '加速度估算',
    };

    設定行走分析(本次分析);
    觸發分析震動(本次分析.狀態);

    // 未來擴充點：若日後需要更精準的步態模型，可透過 JSI 或 Native Modules
    // 串接 C/C++ 輕量化步態分析模型；資料仍只在手機本機端推論，不送往雲端。
  }

  if (目前畫面 === 畫面.設定步速) {
    return (
      <SafeAreaView style={樣式.設定畫面}>
        <StatusBar barStyle="light-content" />
        <View style={樣式.中央內容}>
          <Text style={樣式.品牌文字}>AI 陪走夥伴</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="開始測量步速"
            disabled={正在測量步速}
            onPress={開始測量步速}
            style={({ pressed }) => [
              樣式.主要大按鈕,
              正在測量步速 && 樣式.停用按鈕,
              pressed && !正在測量步速 && 樣式.按下狀態,
            ]}
          >
            {正在測量步速 ? (
              <View style={樣式.載入區塊}>
                <ActivityIndicator color="#000000" size="large" />
                <Text style={樣式.主要按鈕文字}>測量中...</Text>
                <Text style={樣式.輔助文字}>
                  動作資料 {加速度取樣次數} 筆｜步數 {測量步數}
                </Text>
              </View>
            ) : (
              <Text style={樣式.主要按鈕文字}>開始測量步速</Text>
            )}
          </Pressable>
          {!!權限提示 && <Text style={樣式.提示文字}>{權限提示}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  if (目前畫面 === 畫面.首頁待機) {
    return (
      <SafeAreaView style={樣式.首頁畫面}>
        <StatusBar barStyle="light-content" />
        <View style={樣式.中央內容}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="開始步行分析"
            disabled={正在啟動守護}
            onPress={開始步行守護}
            style={({ pressed }) => [
              樣式.首頁巨大按鈕,
              正在啟動守護 && 樣式.停用按鈕,
              pressed && !正在啟動守護 && 樣式.按下狀態,
            ]}
          >
            <Text style={樣式.首頁按鈕文字}>
              {正在啟動守護 ? '啟動中...' : '開始步行分析'}
            </Text>
          </Pressable>
          {!!權限提示 && <Text style={樣式.提示文字}>{權限提示}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const 步態穩定 = 行走分析.狀態 === 分析狀態.步態穩定;
  const 建議休息 = 行走分析.狀態 === 分析狀態.建議休息;
  const 守護背景色 = 步態穩定 ? '#008000' : 建議休息 ? '#FF0000' : '#000000';
  const 守護符號 = 步態穩定 ? '✓' : 建議休息 ? '！' : '…';

  return (
    <View style={[樣式.守護畫面, { backgroundColor: 守護背景色 }]}>
      <StatusBar hidden />
      <View
        accessibilityLiveRegion="assertive"
        accessibilityLabel={行走分析.主文字}
        style={樣式.守護提示區}
      >
        <Text style={樣式.守護符號}>{守護符號}</Text>
        <Text style={樣式.守護主文字}>{行走分析.主文字}</Text>
        <Text style={樣式.守護副文字}>{行走分析.說明文字}</Text>
        <View style={樣式.資料列}>
          <Text style={樣式.資料文字}>步數 {行走分析.步數}</Text>
          <Text style={樣式.資料文字}>步頻 {行走分析.步頻.toFixed(0)} 步/分</Text>
          <Text style={樣式.資料文字}>步速 {行走分析.即時步速.toFixed(2)} m/s</Text>
        </View>
        <Text style={樣式.守護秒數文字}>
          穩定分數 {行走分析.穩定分數}｜{行走分析.資料來源}
        </Text>
        <Text style={樣式.本機提示文字}>僅使用手機步行資料，不使用攝像頭</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="結束分析"
        onPress={結束散步}
        style={({ pressed }) => [
          樣式.結束按鈕,
          pressed && 樣式.結束按下狀態,
        ]}
      >
        <Text style={樣式.結束按鈕文字}>結束分析</Text>
      </Pressable>
    </View>
  );
}

const 樣式 = StyleSheet.create({
  設定畫面: {
    flex: 1,
    backgroundColor: '#000000',
  },
  首頁畫面: {
    flex: 1,
    backgroundColor: '#000000',
  },
  中央內容: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  品牌文字: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    marginBottom: 28,
    textAlign: 'center',
  },
  主要大按鈕: {
    width: '92%',
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  停用按鈕: {
    opacity: 0.86,
  },
  按下狀態: {
    transform: [{ scale: 0.98 }],
  },
  載入區塊: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  主要按鈕文字: {
    color: '#000000',
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
  },
  輔助文字: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  首頁巨大按鈕: {
    width: '80%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  首頁按鈕文字: {
    color: '#000000',
    fontSize: 50,
    fontWeight: '900',
    textAlign: 'center',
  },
  提示文字: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 34,
    marginTop: 24,
    maxWidth: '92%',
    textAlign: 'center',
  },
  守護畫面: {
    flex: 1,
  },
  守護提示區: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 116,
  },
  守護符號: {
    color: '#FFFFFF',
    fontSize: 152,
    fontWeight: '900',
    lineHeight: 162,
    textAlign: 'center',
  },
  守護主文字: {
    color: '#FFFFFF',
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 58,
    marginTop: 10,
    textAlign: 'center',
  },
  守護副文字: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 38,
    marginTop: 14,
    textAlign: 'center',
  },
  資料列: {
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  資料文字: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  守護秒數文字: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 32,
    marginTop: 20,
    textAlign: 'center',
  },
  本機提示文字: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 28,
    marginTop: 12,
    opacity: 0.92,
    textAlign: 'center',
  },
  結束按鈕: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 32,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 3,
  },
  結束按下狀態: {
    opacity: 0.75,
  },
  結束按鈕文字: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
});
