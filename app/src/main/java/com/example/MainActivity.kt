package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity(), SensorEventListener {
    private lateinit var sensorManager: SensorManager
    private var gyroscopeSensor: Sensor? = null
    
    @Volatile
    private var gyroPitchSum = 0f
    @Volatile
    private var gyroYawSum = 0f
    
    private var isGyroEnabled = false
    private var gyroSensitivity = 1.0f

    private var vibrator: Vibrator? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize sensors
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        gyroscopeSensor = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
        
        // Initialize vibrator safely across compatible versions
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        
        enableEdgeToEdge()
        
        setContent {
            MyApplicationTheme {
                GameScreen()
            }
        }
        
        hideSystemUI()
    }

    override fun onResume() {
        super.onResume()
        if (isGyroEnabled) {
            registerGyroscope()
        }
    }

    override fun onPause() {
        super.onPause()
        unregisterGyroscope()
    }

    private fun registerGyroscope() {
        gyroscopeSensor?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
        }
    }

    private fun unregisterGyroscope() {
        sensorManager.unregisterListener(this)
    }

    private fun hideSystemUI() {
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
        windowInsetsController.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }

    // SensorEventListener methods
    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type == Sensor.TYPE_GYROSCOPE) {
            // Tilting forward/backward is rotation about local X-axis (values[0])
            // Tilting left/right (yawing in landscape) is rotation about local Y-axis (values[1])
            synchronized(this) {
                gyroPitchSum += event.values[0] * gyroSensitivity
                gyroYawSum += event.values[1] * gyroSensitivity
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // No implementation needed
    }

    inner class WebAppInterface {
        @JavascriptInterface
        fun exitApp() {
            finish()
        }

        @JavascriptInterface
        fun setGyroscopeEnabled(enabled: Boolean) {
            isGyroEnabled = enabled
            runOnUiThread {
                if (enabled) {
                    registerGyroscope()
                } else {
                    unregisterGyroscope()
                    synchronized(this@MainActivity) {
                        gyroPitchSum = 0f
                        gyroYawSum = 0f
                    }
                }
            }
        }

        @JavascriptInterface
        fun setGyroscopeSensitivity(sens: Float) {
            gyroSensitivity = sens
        }

        @JavascriptInterface
        fun hasGyroscope(): Boolean {
            return gyroscopeSensor != null
        }

        @JavascriptInterface
        fun pollGyro(): String {
            var pitch = 0f
            var yaw = 0f
            synchronized(this@MainActivity) {
                pitch = gyroPitchSum
                yaw = gyroYawSum
                gyroPitchSum = 0f
                gyroYawSum = 0f
            }
            return "$pitch,$yaw"
        }

        @JavascriptInterface
        fun vibrate(type: String) {
            val ms = when (type) {
                "light" -> 15L
                "medium" -> 45L
                "heavy" -> 120L
                else -> 30L
            }
            val amplitude = when (type) {
                "light" -> 80
                "medium" -> 180
                "heavy" -> 255
                else -> 128
            }
            triggerVibration(ms, amplitude)
        }

        @JavascriptInterface
        fun vibrateCustom(ms: Long, amplitude: Int) {
            val clampedAmp = amplitude.coerceIn(1, 255)
            triggerVibration(ms, clampedAmp)
        }
    }

    private fun triggerVibration(milliseconds: Long, amplitude: Int) {
        try {
            vibrator?.let {
                if (it.hasVibrator()) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        it.vibrate(VibrationEffect.createOneShot(milliseconds, amplitude))
                    } else {
                        @Suppress("DEPRECATION")
                        it.vibrate(milliseconds)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun GameScreen() {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.allowFileAccess = true
                settings.allowFileAccessFromFileURLs = true
                settings.allowUniversalAccessFromFileURLs = true
                settings.mediaPlaybackRequiresUserGesture = false
                settings.databaseEnabled = true
                settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
                settings.setSupportMultipleWindows(false)
                settings.javaScriptCanOpenWindowsAutomatically = false
                
                setLayerType(View.LAYER_TYPE_HARDWARE, null)
                
                settings.allowContentAccess = true
                
                webViewClient = WebViewClient()
                
                addJavascriptInterface((context as MainActivity).WebAppInterface(), "Android")
                
                loadUrl("file:///android_asset/index.html")
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}
