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
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';

const 畫面 = {
  設定步速: '設定步速',
  首頁待機: '首頁待機',
  過馬路守護: '過馬路守護',
};

const 守護結果 = {
  等待判讀: '等待判讀',
  可以通過: '可以通過',
  請勿通過: '請勿通過',
};

const 預設平均步速 = 0.8;
const 斑馬線長度 = 20;
const 模擬最短綠燈秒數 = 5;
const 模擬最長綠燈秒數 = 40;

export default function App() {
  const [目前畫面, 設定目前畫面] = useState(畫面.設定步速);
  const [平均步速, 設定平均步速] = useState(null);
  const [正在測量步速, 設定正在測量步速] = useState(false);
  const [加速度取樣次數, 設定加速度取樣次數] = useState(0);
  const [剩餘綠燈秒數, 設定剩餘綠燈秒數] = useState(null);
  const [守護狀態, 設定守護狀態] = useState(守護結果.等待判讀);
  const [權限提示, 設定權限提示] = useState('');
  const [相機權限狀態, 請求相機權限] = useCameraPermissions();
  const 加速度訂閱 = useRef(null);
  const 步速計時器 = useRef(null);
  const 影像辨識計時器 = useRef(null);
  const 暫存影格參照 = useRef(null);

  const 安全穿越所需秒數 = 平均步速 ? 斑馬線長度 / 平均步速 : 0;

  useEffect(() => {
    return () => {
      清除步速測量資源();
      清除守護資源();
    };
  }, []);

  useEffect(() => {
    if (目前畫面 !== 畫面.過馬路守護 || !平均步速) {
      return;
    }

    執行本地端影像辨識模擬();
    影像辨識計時器.current = setInterval(執行本地端影像辨識模擬, 3000);

    return () => {
      清除守護資源();
    };
  }, [目前畫面, 平均步速]);

  useEffect(() => {
    if (目前畫面 !== 畫面.過馬路守護) {
      return;
    }

    if (守護狀態 === 守護結果.可以通過) {
      發出語音提示('時間充足，安心通過');
    }

    if (守護狀態 === 守護結果.請勿通過) {
      發出語音提示('時間不夠，請退回！');
    }
  }, [目前畫面, 守護狀態, 剩餘綠燈秒數]);

  function 清除步速測量資源() {
    if (步速計時器.current) {
      clearTimeout(步速計時器.current);
      步速計時器.current = null;
    }

    if (加速度訂閱.current) {
      加速度訂閱.current.remove();
      加速度訂閱.current = null;
    }
  }

  function 清除守護資源() {
    if (影像辨識計時器.current) {
      clearInterval(影像辨識計時器.current);
      影像辨識計時器.current = null;
    }

    暫存影格參照.current = null;
    Vibration.cancel();
  }

  function 發出語音提示(提示文字) {
    // 使用系統螢幕閱讀器做本機語音提示；文字不會送到雲端服務。
    AccessibilityInfo.announceForAccessibility(提示文字);
  }

  async function 開始測量步速() {
    設定權限提示('');
    設定正在測量步速(true);
    設定加速度取樣次數(0);

    try {
      await Accelerometer.requestPermissionsAsync();
      Accelerometer.setUpdateInterval(250);
      加速度訂閱.current = Accelerometer.addListener(() => {
        // Demo 只模擬收集加速度資料；正式版可由取樣峰值估算步頻與步幅。
        設定加速度取樣次數((目前次數) => 目前次數 + 1);
      });
    } catch (錯誤) {
      設定權限提示('無法讀取動作感測器，將使用示範步速。');
    }

    步速計時器.current = setTimeout(() => {
      清除步速測量資源();
      設定平均步速(預設平均步速);
      設定正在測量步速(false);
      發出語音提示('步速測量完成');
      設定目前畫面(畫面.首頁待機);
    }, 3000);
  }

  async function 開始散步守護() {
    設定權限提示('');

    const 相機結果 = 相機權限狀態?.granted
      ? 相機權限狀態
      : await 請求相機權限();

    if (!相機結果?.granted) {
      設定權限提示('請允許相機權限，才能在本機判讀號誌。');
      發出語音提示('請允許相機權限');
      return;
    }

    const 定位結果 = await Location.requestForegroundPermissionsAsync();

    if (定位結果.status !== 'granted') {
      設定權限提示('請允許定位權限，才能啟動路口守護模式。');
      發出語音提示('請允許定位權限');
      return;
    }

    設定守護狀態(守護結果.等待判讀);
    設定剩餘綠燈秒數(null);
    發出語音提示('守護模式啟動');
    設定目前畫面(畫面.過馬路守護);
  }

  function 結束散步() {
    清除守護資源();
    設定守護狀態(守護結果.等待判讀);
    設定剩餘綠燈秒數(null);
    發出語音提示('已結束散步');
    設定目前畫面(畫面.首頁待機);
  }

  function 產生模擬綠燈秒數() {
    const 範圍 = 模擬最長綠燈秒數 - 模擬最短綠燈秒數 + 1;
    return Math.floor(Math.random() * 範圍) + 模擬最短綠燈秒數;
  }

  function 執行本地端影像辨識模擬() {
    // 隱私原則：此 Demo 不拍照、不錄影、不儲存影像，也沒有任何網路上傳。
    // 未來擴充點：可透過 JSI 或 Native Modules 串接 C/C++ 輕量化視覺辨識模型，
    // 在原生端讀取單一相機影格、辨識行人號誌秒數，並只回傳整數秒數給 JavaScript。
    let 本次影格 = null;
    暫存影格參照.current = 本次影格;

    const 本次剩餘秒數 = 產生模擬綠燈秒數();
    設定剩餘綠燈秒數(本次剩餘秒數);

    // 數學公式：安全穿越所需秒數 = 斑馬線長度（公尺） / 使用者平均步速（公尺/秒）。
    // 決策規則：剩餘綠燈秒數足夠時才建議通過，否則請使用者退回等待。
    if (本次剩餘秒數 >= 安全穿越所需秒數) {
      設定守護狀態(守護結果.可以通過);
      Vibration.vibrate();
    } else {
      設定守護狀態(守護結果.請勿通過);
      Vibration.vibrate([500, 500, 500]);
    }

    // 影格處理完畢後立即清除參照，避免留下可識別的隱私資料。
    本次影格 = null;
    暫存影格參照.current = null;
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
                <Text style={樣式.輔助文字}>已讀取 {加速度取樣次數} 筆動作資料</Text>
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
            accessibilityLabel="出門散步去"
            onPress={開始散步守護}
            style={({ pressed }) => [
              樣式.首頁巨大按鈕,
              pressed && 樣式.按下狀態,
            ]}
          >
            <Text style={樣式.首頁按鈕文字}>出門散步去</Text>
          </Pressable>
          {!!權限提示 && <Text style={樣式.提示文字}>{權限提示}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const 可以通過 = 守護狀態 === 守護結果.可以通過;
  const 請勿通過 = 守護狀態 === 守護結果.請勿通過;
  const 守護背景色 = 可以通過 ? '#008000' : 請勿通過 ? '#FF0000' : '#000000';
  const 守護符號 = 可以通過 ? '✓' : 請勿通過 ? '！' : '…';
  const 守護文字 = 可以通過
    ? '時間充足，安心通過'
    : 請勿通過
      ? '時間不夠，請退回！'
      : '正在判讀號誌';

  return (
    <View style={[樣式.守護畫面, { backgroundColor: 守護背景色 }]}>
      <StatusBar hidden />
      <CameraView
        active
        animateShutter={false}
        facing="back"
        style={樣式.隱藏相機}
      />
      <View
        accessibilityLiveRegion="assertive"
        accessibilityLabel={守護文字}
        style={樣式.守護提示區}
      >
        <Text style={樣式.守護符號}>{守護符號}</Text>
        <Text style={樣式.守護主文字}>{守護文字}</Text>
        <Text style={樣式.守護秒數文字}>
          {剩餘綠燈秒數 === null
            ? `需要 ${安全穿越所需秒數.toFixed(0)} 秒`
            : `綠燈剩 ${剩餘綠燈秒數} 秒，需要 ${安全穿越所需秒數.toFixed(0)} 秒`}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="結束散步"
        onPress={結束散步}
        style={({ pressed }) => [
          樣式.結束按鈕,
          pressed && 樣式.結束按下狀態,
        ]}
      >
        <Text style={樣式.結束按鈕文字}>結束散步</Text>
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
    fontSize: 52,
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
  隱藏相機: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  守護提示區: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 112,
  },
  守護符號: {
    color: '#FFFFFF',
    fontSize: 160,
    fontWeight: '900',
    lineHeight: 170,
    textAlign: 'center',
  },
  守護主文字: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 62,
    marginTop: 12,
    textAlign: 'center',
  },
  守護秒數文字: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 38,
    marginTop: 22,
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
